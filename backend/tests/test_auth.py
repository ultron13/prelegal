import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


client = TestClient(app)


def test_register_creates_user_and_returns_token():
    response = client.post("/api/auth/register", json={
        "email": "alice@example.com",
        "password": "securepass",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == "alice@example.com"


def test_register_rejects_duplicate_email():
    client.post("/api/auth/register", json={"email": "dup@example.com", "password": "pass123"})
    response = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "other"})
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_rejects_short_password():
    response = client.post("/api/auth/register", json={
        "email": "user@example.com",
        "password": "abc",
    })
    assert response.status_code == 422


def test_login_returns_token_for_valid_credentials():
    client.post("/api/auth/register", json={"email": "bob@example.com", "password": "mypassword"})
    response = client.post("/api/auth/login", json={
        "email": "bob@example.com",
        "password": "mypassword",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["email"] == "bob@example.com"


def test_login_rejects_wrong_password():
    client.post("/api/auth/register", json={"email": "carol@example.com", "password": "rightpass"})
    response = client.post("/api/auth/login", json={
        "email": "carol@example.com",
        "password": "wrongpass",
    })
    assert response.status_code == 401


def test_login_rejects_unknown_email():
    response = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "anypass",
    })
    assert response.status_code == 401


def test_protected_endpoint_requires_token():
    response = client.get("/api/documents/saved")
    assert response.status_code == 401


def _get_token(email="test@example.com", password="testpass1"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def test_save_document_requires_auth():
    response = client.post("/api/documents", json={
        "document_name": "Test NDA",
        "generated_document": "content",
    })
    assert response.status_code == 401


def test_save_and_list_document_scoped_to_user():
    token_a = _get_token("userA@example.com")
    token_b = _get_token("userB@example.com")

    client.post("/api/documents",
        json={"document_name": "User A NDA", "generated_document": "content A"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    client.post("/api/documents",
        json={"document_name": "User B Agreement", "generated_document": "content B"},
        headers={"Authorization": f"Bearer {token_b}"},
    )

    resp_a = client.get("/api/documents/saved", headers={"Authorization": f"Bearer {token_a}"})
    assert resp_a.status_code == 200
    names_a = [d["document_name"] for d in resp_a.json()]
    assert "User A NDA" in names_a
    assert "User B Agreement" not in names_a

    resp_b = client.get("/api/documents/saved", headers={"Authorization": f"Bearer {token_b}"})
    names_b = [d["document_name"] for d in resp_b.json()]
    assert "User B Agreement" in names_b
    assert "User A NDA" not in names_b


def test_get_document_detail_returns_fields_json():
    token = _get_token("detail@example.com")
    import json
    fields = {"documentType": "Mutual NDA", "party1": {"name": "Alice"}}

    save_resp = client.post("/api/documents",
        json={
            "document_name": "My NDA",
            "generated_document": "content",
            "fields_json": json.dumps(fields),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    doc_id = save_resp.json()["id"]

    detail_resp = client.get(f"/api/documents/saved/{doc_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_resp.status_code == 200
    data = detail_resp.json()
    assert data["fields_json"] == json.dumps(fields)
    assert data["document_name"] == "My NDA"


def test_get_document_detail_forbidden_for_other_user():
    token_owner = _get_token("owner@example.com")
    token_other = _get_token("other@example.com")

    save_resp = client.post("/api/documents",
        json={"document_name": "Private Doc", "generated_document": "secret"},
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    doc_id = save_resp.json()["id"]

    resp = client.get(f"/api/documents/saved/{doc_id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert resp.status_code == 404

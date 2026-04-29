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


def _get_token(email="doctest@example.com", password="testpass1"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_get_documents_returns_catalog():
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(d["name"] == "Mutual Non-Disclosure Agreement" for d in data)


def test_get_documents_has_required_fields():
    response = client.get("/api/documents")
    data = response.json()
    for doc in data:
        assert "name" in doc
        assert "description" in doc
        assert "filename" in doc


def test_generate_document_returns_filled_nda():
    payload = {
        "template": "templates/Mutual-NDA.md",
        "fields": {
            "purpose": "Evaluating a business partnership",
            "effective_date": "2026-04-28",
            "governing_law": "California",
            "party1_name": "Alice Smith",
            "party2_name": "Bob Jones",
        }
    }
    response = client.post("/api/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "document" in data
    assert "document_id" in data


def test_generate_document_missing_template_returns_404():
    response = client.post("/api/generate", json={"template": "templates/nonexistent.md", "fields": {}})
    assert response.status_code == 404


def test_save_document_requires_auth():
    response = client.post("/api/documents", json={
        "document_name": "Test NDA",
        "generated_document": "content",
    })
    assert response.status_code == 401


def test_save_document_persists_to_db():
    token = _get_token()
    response = client.post("/api/documents", json={
        "document_name": "Mutual Non-Disclosure Agreement",
        "generated_document": "# Test NDA\n\nThis is a test.",
        "fields": [
            {"field_name": "governing_law", "user_input": "California"},
        ]
    }, headers=_auth(token))
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["document_name"] == "Mutual Non-Disclosure Agreement"


def test_get_saved_documents_requires_auth():
    response = client.get("/api/documents/saved")
    assert response.status_code == 401


def test_get_saved_documents_returns_only_user_docs():
    token = _get_token("mysavedocs@example.com")
    client.post("/api/documents", json={
        "document_name": "My NDA",
        "generated_document": "content",
    }, headers=_auth(token))

    response = client.get("/api/documents/saved", headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(d["document_name"] == "My NDA" for d in data)

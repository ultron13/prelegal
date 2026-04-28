import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base


TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
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
            "mnda_term": "expires",
            "mnda_term_years": "2",
            "term_of_confidentiality": "years",
            "confidentiality_years": "3",
            "governing_law": "California",
            "jurisdiction": "San Francisco, CA",
            "party1_name": "Alice Smith",
            "party1_title": "CEO",
            "party1_company": "Acme Corp",
            "party1_email": "alice@acme.com",
            "party2_name": "Bob Jones",
            "party2_title": "CTO",
            "party2_company": "Beta Inc",
            "party2_email": "bob@beta.com",
        }
    }
    response = client.post("/api/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "document" in data
    assert "document_id" in data


def test_generate_document_missing_template_returns_404():
    payload = {
        "template": "templates/nonexistent.md",
        "fields": {}
    }
    response = client.post("/api/generate", json=payload)
    assert response.status_code == 404


def test_save_document_persists_to_db():
    save_payload = {
        "document_name": "Mutual Non-Disclosure Agreement",
        "generated_document": "# Test NDA\n\nThis is a test.",
        "fields": [
            {"field_name": "governing_law", "user_input": "California"},
            {"field_name": "jurisdiction", "user_input": "San Francisco, CA"},
        ]
    }
    response = client.post("/api/documents", json=save_payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["document_name"] == "Mutual Non-Disclosure Agreement"


def test_get_saved_documents():
    save_payload = {
        "document_name": "Test NDA",
        "generated_document": "# Test",
        "fields": []
    }
    client.post("/api/documents", json=save_payload)

    response = client.get("/api/documents/saved")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

MOCK_LLM_RESPONSE = {
    "message": "Great! What is the effective date of the NDA? (YYYY-MM-DD)",
    "fields": {
        "purpose": "evaluating a potential business partnership"
    },
    "is_complete": False,
}

MOCK_LLM_RESPONSE_COMPLETE = {
    "message": "I have all the details. Your NDA is ready to generate!",
    "fields": {
        "purpose": "evaluating a potential business partnership",
        "effectiveDate": "2026-04-28",
        "mndaTerm": "expires",
        "mndaTermYears": "2",
        "termOfConfidentiality": "years",
        "confidentialityYears": "3",
        "governingLaw": "California",
        "jurisdiction": "San Francisco, CA",
        "party1": {"name": "Alice Smith", "title": "CEO", "company": "Acme Corp", "email": "alice@acme.com"},
        "party2": {"name": "Bob Jones", "title": "CTO", "company": "Beta Inc", "email": "bob@beta.com"},
    },
    "is_complete": True,
}


def _make_mock_completion(content_dict):
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = str(content_dict).replace("'", '"').replace("False", "false").replace("True", "true").replace("None", "null")
    import json
    mock_completion.choices[0].message.content = json.dumps(content_dict)
    return mock_completion


@patch("app.routers.chat.get_llm_client")
def test_chat_returns_message_and_fields(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.chat.completions.create.return_value = _make_mock_completion(MOCK_LLM_RESPONSE)

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "We want to evaluate a business partnership"}],
        "current_fields": {},
    })

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "fields" in data
    assert "is_complete" in data
    assert data["fields"]["purpose"] == "evaluating a potential business partnership"
    assert data["is_complete"] is False


@patch("app.routers.chat.get_llm_client")
def test_chat_is_complete_when_all_fields_filled(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.chat.completions.create.return_value = _make_mock_completion(MOCK_LLM_RESPONSE_COMPLETE)

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "That's everything"}],
        "current_fields": {},
    })

    assert response.status_code == 200
    data = response.json()
    assert data["is_complete"] is True
    assert data["fields"]["party1"]["company"] == "Acme Corp"


@patch("app.routers.chat.get_llm_client")
def test_chat_sends_conversation_history(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.chat.completions.create.return_value = _make_mock_completion(MOCK_LLM_RESPONSE)

    messages = [
        {"role": "user", "content": "partnership evaluation"},
        {"role": "assistant", "content": "Got it! What is the effective date?"},
        {"role": "user", "content": "April 28 2026"},
    ]

    client.post("/api/chat", json={"messages": messages, "current_fields": {}})

    call_args = mock_client.chat.completions.create.call_args
    sent_messages = call_args.kwargs["messages"]
    # system prompt + all 3 history messages
    assert len(sent_messages) == 4
    assert sent_messages[0]["role"] == "system"


@patch("app.routers.chat.get_llm_client")
def test_chat_handles_invalid_llm_json_gracefully(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    bad = MagicMock()
    bad.choices[0].message.content = "sorry, I cannot help with that"
    mock_client.chat.completions.create.return_value = bad

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "hi"}],
        "current_fields": {},
    })

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["fields"] == {}
    assert data["is_complete"] is False


@patch("app.routers.chat.get_llm_client")
def test_chat_returns_document_type_in_fields(mock_get_client):
    """AI can identify and return documentType as a field."""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    response_with_doc_type = {
        "message": "Great, I'll help you create a Cloud Service Agreement. What is the name of your cloud service?",
        "fields": {"documentType": "Cloud Service Agreement"},
        "is_complete": False,
    }
    mock_client.chat.completions.create.return_value = _make_mock_completion(response_with_doc_type)

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I need a cloud service agreement"}],
        "current_fields": {},
    })

    assert response.status_code == 200
    data = response.json()
    assert data["fields"]["documentType"] == "Cloud Service Agreement"
    assert data["is_complete"] is False


@patch("app.routers.chat.get_llm_client")
def test_chat_injects_current_fields_into_context(mock_get_client):
    """current_fields are passed as system context so AI knows what it already collected."""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.chat.completions.create.return_value = _make_mock_completion(MOCK_LLM_RESPONSE)

    client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "California"}],
        "current_fields": {"documentType": "Mutual Non-Disclosure Agreement", "purpose": "evaluating a partnership"},
    })

    call_args = mock_client.chat.completions.create.call_args
    sent_messages = call_args.kwargs["messages"]
    # system prompt + current_fields context + user message
    assert len(sent_messages) >= 3
    system_content = " ".join(m["content"] for m in sent_messages if m["role"] == "system")
    assert "documentType" in system_content or "Mutual Non-Disclosure" in system_content


@patch("app.routers.chat.get_llm_client")
def test_chat_handles_unsupported_document_gracefully(mock_get_client):
    """AI returns helpful message for unsupported document types."""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    unsupported_response = {
        "message": "I don't currently support wills and testaments. The closest available document is a Professional Services Agreement. Would that work?",
        "fields": {},
        "is_complete": False,
    }
    mock_client.chat.completions.create.return_value = _make_mock_completion(unsupported_response)

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I need a will and testament"}],
        "current_fields": {},
    })

    assert response.status_code == 200
    data = response.json()
    assert data["is_complete"] is False
    assert len(data["message"]) > 0

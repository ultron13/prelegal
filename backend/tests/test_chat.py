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

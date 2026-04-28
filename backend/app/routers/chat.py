import json
import os
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

SYSTEM_PROMPT = """You are a helpful legal document assistant for PreLegal. Your job is to help the user create a Mutual Non-Disclosure Agreement (NDA) through a natural conversation.

You need to collect the following information:

REQUIRED fields:
- purpose: why the parties are sharing confidential information (a short sentence)
- effectiveDate: when the NDA starts (YYYY-MM-DD format)
- mndaTerm: "expires" (fixed term) or "until_terminated" (open-ended)
- mndaTermYears: number of years as a string (only required if mndaTerm is "expires")
- termOfConfidentiality: "years" (fixed period) or "perpetuity" (forever)
- confidentialityYears: number of years as a string (only required if termOfConfidentiality is "years")
- governingLaw: US state whose laws govern (e.g. "California")
- jurisdiction: city and state for courts (e.g. "San Francisco, CA")
- party1.name and party1.company (required); party1.title and party1.email (optional)
- party2.name and party2.company (required); party2.title and party2.email (optional)

Guidelines:
- Ask one or two questions at a time — don't overwhelm the user with a long list.
- Start by asking for the purpose if not yet provided.
- Be conversational, friendly, and professional.
- When you collect a date naturally (e.g. "April 28, 2026"), convert it to YYYY-MM-DD.
- When mndaTerm or termOfConfidentiality is mentioned, map to the exact values "expires"/"until_terminated" or "years"/"perpetuity".
- Set is_complete to true only when ALL required fields are present.

You MUST respond with valid JSON only — no extra text outside the JSON. Use this exact structure:
{
  "message": "<your conversational reply>",
  "fields": {
    "purpose": "<value or omit if not known>",
    "effectiveDate": "<YYYY-MM-DD or omit>",
    "mndaTerm": "<'expires' or 'until_terminated' or omit>",
    "mndaTermYears": "<number string or omit>",
    "termOfConfidentiality": "<'years' or 'perpetuity' or omit>",
    "confidentialityYears": "<number string or omit>",
    "governingLaw": "<state name or omit>",
    "jurisdiction": "<city, state or omit>",
    "party1": {"name": "...", "title": "...", "company": "...", "email": "..."},
    "party2": {"name": "...", "title": "...", "company": "...", "email": "..."}
  },
  "is_complete": false
}
Only include fields in the "fields" object that you are confident about from the conversation.
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: dict[str, Any] = {}


class ChatResponse(BaseModel):
    message: str
    fields: dict[str, Any]
    is_complete: bool


def get_llm_client():
    from openai import OpenAI
    return OpenAI(
        base_url=os.getenv("OPENAI_BASE_URL"),
        api_key=os.getenv("OPENAI_API_KEY", "no-key"),
    )


def _build_messages(request: ChatRequest) -> list[dict]:
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in request.messages:
        msgs.append({"role": m.role, "content": m.content})
    return msgs


def _parse_llm_response(content: str) -> tuple[str, dict, bool]:
    """Parse LLM JSON response. Returns (message, fields, is_complete)."""
    try:
        text = content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)
        message = data.get("message", content)
        fields = data.get("fields", {})
        is_complete = bool(data.get("is_complete", False))
        return message, fields, is_complete
    except (json.JSONDecodeError, AttributeError):
        return content, {}, False


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    client = get_llm_client()
    model = os.getenv("OPENAI_MODEL", "gpt-5.2")

    completion = client.chat.completions.create(
        model=model,
        messages=_build_messages(request),
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    raw = completion.choices[0].message.content or ""
    message, fields, is_complete = _parse_llm_response(raw)

    return ChatResponse(message=message, fields=fields, is_complete=is_complete)

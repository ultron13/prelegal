import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import GeneratedDocument, User, UserInput

router = APIRouter()

CATALOG_PATH = Path(__file__).parent.parent.parent.parent / "catalog.json"
TEMPLATES_BASE = Path(__file__).parent.parent.parent.parent


class GenerateRequest(BaseModel):
    template: str
    fields: dict[str, Any]


class FieldInput(BaseModel):
    field_name: str
    user_input: str


class SaveDocumentRequest(BaseModel):
    document_name: str
    generated_document: str
    fields_json: str | None = None
    fields: list[FieldInput] = []


@router.get("/documents")
def get_documents():
    if not CATALOG_PATH.exists():
        raise HTTPException(status_code=500, detail="Catalog not found")
    with open(CATALOG_PATH) as f:
        return json.load(f)


@router.post("/generate")
def generate_document(request: GenerateRequest, db: Session = Depends(get_db)):
    template_path = TEMPLATES_BASE / request.template
    if not template_path.exists():
        raise HTTPException(status_code=404, detail=f"Template not found: {request.template}")

    content = template_path.read_text()
    for key, value in request.fields.items():
        content = content.replace(f"{{{{{key}}}}}", str(value))

    doc = GeneratedDocument(document_name=request.template, generated_document=content)
    db.add(doc)
    db.commit()
    db.refresh(doc)

    for field_name, user_input in request.fields.items():
        db.add(UserInput(document_id=doc.id, field_name=field_name, user_input=str(user_input)))
    db.commit()

    return {"document": content, "document_id": doc.id}


@router.post("/documents", status_code=201)
def save_document(
    request: SaveDocumentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = GeneratedDocument(
        document_name=request.document_name,
        generated_document=request.generated_document,
        fields_json=request.fields_json,
        user_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    for field in request.fields:
        db.add(UserInput(document_id=doc.id, field_name=field.field_name, user_input=field.user_input))
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "document_name": doc.document_name,
        "date_generated": doc.date_generated.isoformat(),
    }


@router.get("/documents/saved")
def get_saved_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = (
        db.query(GeneratedDocument)
        .filter(GeneratedDocument.user_id == current_user.id)
        .order_by(GeneratedDocument.date_generated.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "document_name": d.document_name,
            "date_generated": d.date_generated.isoformat(),
        }
        for d in docs
    ]


@router.get("/documents/saved/{document_id}")
def get_saved_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = (
        db.query(GeneratedDocument)
        .filter(
            GeneratedDocument.id == document_id,
            GeneratedDocument.user_id == current_user.id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "id": doc.id,
        "document_name": doc.document_name,
        "date_generated": doc.date_generated.isoformat(),
        "fields_json": doc.fields_json,
        "generated_document": doc.generated_document,
    }

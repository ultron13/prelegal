from datetime import datetime, UTC
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_name = Column(String, nullable=False)
    generated_document = Column(Text, nullable=False)
    date_generated = Column(DateTime, default=lambda: datetime.now(UTC))

    user_inputs = relationship("UserInput", back_populates="document", cascade="all, delete-orphan")


class UserInput(Base):
    __tablename__ = "user_input"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("generated_documents.id"), nullable=False)
    field_name = Column(String, nullable=False)
    user_input = Column(Text, nullable=False)
    date_entered = Column(DateTime, default=lambda: datetime.now(UTC))

    document = relationship("GeneratedDocument", back_populates="user_inputs")

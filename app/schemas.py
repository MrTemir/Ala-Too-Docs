from __future__ import annotations

import uuid
import enum
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import DocumentStatus, UserRole


class DocumentLanguage(str, enum.Enum):
    english = "english"
    russian = "russian"
    kyrgyz = "kyrgyz"


class StudentSex(str, enum.Enum):
    male = "male"
    female = "female"


class UserCreate(BaseModel):
    university_id: str
    full_name: str
    role: UserRole
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    university_id: str
    full_name: str
    faculty: str | None = None
    group_name: str | None = None
    role: UserRole


class BroadcastRequest(BaseModel):
    title: str
    text: str
    target_faculty: str


class BroadcastResponse(BaseModel):
    created_count: int
    target_faculty: str


class LoginRequest(BaseModel):
    university_id: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class DocumentCreate(BaseModel):
    title: str
    raw_text: str
    file_url: str | None = None
    recipient_id: uuid.UUID
    language: DocumentLanguage = DocumentLanguage.russian


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    doc_type: str | None = None
    raw_text: str
    file_url: str | None
    status: DocumentStatus
    creator_id: uuid.UUID
    recipient_id: uuid.UUID
    created_at: datetime | None = None


class SignatureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    user_id: uuid.UUID
    signature_hash: str
    signed_at: datetime


class DocumentDetailResponse(DocumentResponse):
    signatures: list[SignatureResponse] = []


class DocumentGenerateRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=8000)
    language: DocumentLanguage = DocumentLanguage.russian


class DocumentGenerateResponse(BaseModel):
    generated_text: str


class DocumentTranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=12000)
    language: DocumentLanguage

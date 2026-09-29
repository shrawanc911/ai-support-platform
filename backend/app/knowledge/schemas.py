from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class KnowledgeDocumentCreate(BaseModel):

    title: str = Field(
        min_length=3,
        max_length=300,
    )

    content: str = Field(
        min_length=20,
    )

    source: str | None = Field(
        default=None,
        max_length=500,
    )


class KnowledgeDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    organization_id: UUID
    title: str
    source: str | None
    created_at: datetime
    updated_at: datetime

class KnowledgeChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    chunk_index: int
    content: str
    created_at: datetime

class KnowledgeDocumentDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    title: str
    content: str
    source: str | None
    created_at: datetime
    updated_at: datetime
    chunks: list[KnowledgeChunkResponse]

class KnowledgeSearchResult(BaseModel):

    chunk_id: UUID

    document_id: UUID

    document_title: str

    content: str

    similarity: float
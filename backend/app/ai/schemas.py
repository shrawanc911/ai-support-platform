from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.models.ai_job import AIJobStatus
from app.ai.enums import (
    TicketCategory,
    Sentiment,
)
from app.models.ticket import TicketPriority


class AISourceResponse(BaseModel):
    id: UUID
    document_id: UUID
    chunk_id: UUID
    document_title: str
    content: str
    similarity: float


class TicketAIAnalysisResult(BaseModel):
    category: TicketCategory
    priority: TicketPriority
    sentiment: Sentiment
    summary: str = Field(
        min_length=1,
        max_length=1000,
    )
    suggested_response: str = Field(
        min_length=1,
        max_length=3000,
    )
    confidence: float = Field(
        ge=0,
        le=1,
    )
    evidence_summary: str = Field(
        min_length=1,
        max_length=2000,
    )
    source: list[AISourceResponse]

class AIJobResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    ticket_id: UUID
    status: AIJobStatus
    progress_message: str | None
    error_message:str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


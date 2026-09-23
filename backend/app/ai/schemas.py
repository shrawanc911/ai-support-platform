from pydantic import BaseModel, Field

from app.ai.enums import (
    TicketCategory,
    Sentiment,
)
from app.models.ticket import TicketPriority


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
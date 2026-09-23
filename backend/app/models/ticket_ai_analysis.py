import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.ticket import Ticket


class TicketAIAnalysis(Base):
    __tablename__ = "ticket_ai_analyses"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    ticket_id: Mapped[UUID] = mapped_column(
        ForeignKey("tickets.id"),
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    sentiment: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    suggested_response: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    reasoning: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    prompt_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="v1",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    ticket: Mapped["Ticket"] = relationship(
        back_populates="ai_analyses"
    )
import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Text,
    func,
    String
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from enum import Enum as PyEnum
from app.models.base import Base


class AIJobStatus(str, PyEnum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AIJob(Base):
    __tablename__ = "ai_jobs"

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

    progress_message: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    status: Mapped[AIJobStatus] = mapped_column(
        Enum(AIJobStatus),
        nullable=False,
        default=AIJobStatus.QUEUED,
        index=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    attempts: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )
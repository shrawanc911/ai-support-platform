from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AISource(Base):
    __tablename__ = "ai_sources"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    analysis_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "ticket_ai_analyses.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    document_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "knowledge_documents.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    chunk_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "knowledge_chunks.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    document_title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    similarity: Mapped[float] = mapped_column(
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )
from datetime import datetime
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.config import settings
from app.models.base import Base


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    document_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "knowledge_documents.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    embedding = mapped_column(
        Vector(settings.EMBEDDING_DIMENSION),
        nullable=False,
    )

    token_count: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    char_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    document = relationship(
        "KnowledgeDocument",
        back_populates="chunks",
    )
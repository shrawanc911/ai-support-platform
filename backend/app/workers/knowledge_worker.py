import asyncio
import json
from pathlib import Path

from sqlalchemy import select

from app.ai.embeddings import embedding_service
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.redis import redis_client
from app.knowledge.chunker import chunk_text
from app.knowledge.extractor import (
    clean_text,
    extract_text,
)
from app.knowledge.queue import (
    KNOWLEDGE_INGESTION_QUEUE,
)
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.knowledge_document import (
    KnowledgeDocument,
    KnowledgeDocumentStatus,
)


async def process_document(
    document_id: str,
) -> None:

    async with AsyncSessionLocal() as db:

        document = await db.scalar(
            select(KnowledgeDocument).where(
                KnowledgeDocument.id == document_id
            )
        )

        if not document:
            return

        if (
            document.status
            == KnowledgeDocumentStatus.READY
        ):
            return

        document.status = (
            KnowledgeDocumentStatus.PROCESSING
        )
        document.error_message = None

        await db.commit()

        try:
            if not document.storage_path:
                raise FileNotFoundError(
                    "Document storage path is missing"
                )

            file_path = Path(
                document.storage_path
            )

            raw_text = extract_text(
                str(file_path),
                document.file_type or "",
            )

            cleaned_text = clean_text(raw_text)

            if len(cleaned_text) < 20:
                raise ValueError(
                    "Document does not contain enough text"
                )

            chunks = chunk_text(cleaned_text)

            if not chunks:
                raise ValueError(
                    "No chunks generated from document"
                )

            embeddings = (
                embedding_service.embed_many(chunks)
            )

            for index, (
                content,
                embedding,
            ) in enumerate(
                zip(chunks, embeddings)
            ):
                db.add(
                    KnowledgeChunk(
                        organization_id=document.organization_id,
                        document_id=document.id,
                        chunk_index=index,
                        content=content,
                        embedding=embedding,
                        char_count=len(content)
                    )
                )

            document.content = cleaned_text
            document.status = (
                KnowledgeDocumentStatus.READY
            )

            await db.commit()

        except Exception as exc:
            document.status = (
                KnowledgeDocumentStatus.FAILED
            )
            document.error_message = str(exc)

            await db.commit()


async def worker() -> None:

    print(
        "Knowledge ingestion worker started"
    )

    while True:

        result = await redis_client.blpop(
            KNOWLEDGE_INGESTION_QUEUE,
            timeout=5,
        )

        if not result:
            continue

        _, raw_payload = result

        payload = json.loads(raw_payload)

        document_id = payload["document_id"]

        await process_document(
            document_id
        )


if __name__ == "__main__":
    asyncio.run(worker())
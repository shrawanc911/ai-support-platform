import json
from uuid import UUID

from app.core.redis import redis_client


KNOWLEDGE_INGESTION_QUEUE = (
    "knowledge_document_ingestion"
)


async def enqueue_document_ingestion(
    document_id: UUID,
) -> None:

    payload = {
        "document_id": str(document_id),
    }

    await redis_client.rpush(
        KNOWLEDGE_INGESTION_QUEUE,
        json.dumps(payload),
    )
import json
from uuid import UUID

from app.core.redis import redis_client


AI_QUEUE_NAME = "ai_ticket_analysis"


async def enqueue_ticket_analysis(
    job_id: UUID,
    ticket_id: UUID,
    QUEUE_NAME: str = AI_QUEUE_NAME
):
    payload = {
        "job_id": str(job_id),
        "ticket_id": str(ticket_id),
    }

    await redis_client.rpush(
        QUEUE_NAME,
        json.dumps(payload),
    )
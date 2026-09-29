import json
from uuid import UUID

from app.core.redis import redis_client


AI_QUEUE_NAME = "ai_ticket_analysis"


async def enqueue_ticket_analysis(
    job_id: UUID,
    ticket_id: UUID,
):
    payload = {
        "job_id": str(job_id),
        "ticket_id": str(ticket_id),
    }

    await redis_client.rpush(
        AI_QUEUE_NAME,
        json.dumps(payload),
    )
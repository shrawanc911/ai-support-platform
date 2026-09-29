import json
from uuid import UUID

from app.core.redis import redis_client


def get_ai_job_channel(job_id: UUID) -> str:
    return f"ai_job:{job_id}"


async def publish_ai_job_event(
    job_id: UUID,
    event: str,
    data: dict,
) -> None:
    channel = get_ai_job_channel(job_id)

    payload = {
        "event": event,
        **data,
    }

    await redis_client.publish(
        channel,
        json.dumps(payload),
    )
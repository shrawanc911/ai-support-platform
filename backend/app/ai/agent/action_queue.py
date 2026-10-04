import json
from uuid import UUID
import asyncio

from app.core.redis import redis_client


AGENT_ACTION_QUEUE_NAME = "agent_actions"


async def enqueue_agent_action(
    action_id: UUID,
) -> None:

    payload = {
        "action_id": str(action_id),
    }

    await redis_client.rpush(
        AGENT_ACTION_QUEUE_NAME,
        json.dumps(payload),
    )

async def requeue_agent_action(
    action_id: UUID,
    delay_seconds: int = 2,
) -> None:

    await asyncio.sleep(delay_seconds)

    await enqueue_agent_action(action_id)
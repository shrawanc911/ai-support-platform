import json
from uuid import UUID

from app.core.redis import redis_client


def action_channel(action_id: UUID) -> str:
    return f"agent_action:{action_id}"


async def publish_action_event(
    action_id: UUID,
    event_type: str,
    data: dict,
) -> None:

    payload = json.dumps({
        "event": event_type,
        "action_id": str(action_id),
        "data": data,
    })

    await redis_client.publish(
        action_channel(action_id),
        payload,
    )
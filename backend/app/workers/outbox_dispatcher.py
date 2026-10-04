import asyncio
import json
from datetime import datetime

from sqlalchemy import select

from app.core.outbox_enums import (
    OutboxEventStatus,
    OutboxEventType,
)
from app.core.config import settings
from app.core.redis import redis_client
from app.core.database import AsyncSessionLocal
from app.models.outbox_event import OutboxEvent
from app.ai.agent.action_queue import (
    AGENT_ACTION_QUEUE_NAME,
)


async def publish_event(event: OutboxEvent) -> None:

    if event.event_type == OutboxEventType.AGENT_ACTION_APPROVED:

        await redis_client.rpush(
            AGENT_ACTION_QUEUE_NAME,
            json.dumps(event.payload),
        )

    else:
        raise ValueError(
            f"Unsupported event type: {event.event_type}"
        )

async def process_outbox_batch():

    async with AsyncSessionLocal() as db:

        result = await db.scalars(
            select(OutboxEvent)
            .where(
                OutboxEvent.status._in(
                    [
                    OutboxEventStatus.PENDING,
                    OutboxEventStatus.FAILED,
                    ]
                )
            )
            .order_by(
                OutboxEvent.created_at.asc()
            )
            .limit(50)
        )

        events = list(result.all())

        for event in events:

            try:

                event.attempts += 1
                if event.attempts >= settings.OUTBOX_MAX_ATTEMPTS:
                    continue
                await publish_event(event)

                event.status = (
                    OutboxEventStatus.PUBLISHED
                )

                event.published_at = datetime.utcnow()
                event.error_message = None

            except Exception as exc:

                event.status = (
                    OutboxEventStatus.FAILED
                )

                event.error_message = str(exc)

        await db.commit()

async def dispatcher_loop():

    print(
        "[OUTBOX] Dispatcher started"
    )

    while True:

        try:

            await process_outbox_batch()

        except Exception as exc:

            print(
                f"[OUTBOX] Dispatcher error: {exc}"
            )

        await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(dispatcher_loop())
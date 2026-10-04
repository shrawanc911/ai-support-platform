import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.outbox_enums import OutboxEventType
from app.models.outbox_event import OutboxEvent


async def create_outbox_event(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_type: OutboxEventType,
    payload: dict,
) -> OutboxEvent:

    event = OutboxEvent(
        organization_id=organization_id,
        event_type=event_type,
        payload=payload,
    )

    db.add(event)

    await db.flush()

    return event
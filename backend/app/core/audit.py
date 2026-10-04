import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_enums import AuditEventType
from app.models.audit_log import AuditLog


async def create_audit_log(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_type: AuditEventType,
    ticket_id: uuid.UUID | None = None,
    action_id: uuid.UUID | None = None,
    actor_id: uuid.UUID | None = None,
    details: dict | None = None,
    message: str | None = None,
) -> AuditLog:

    audit = AuditLog(
        organization_id=organization_id,
        ticket_id=ticket_id,
        action_id=action_id,
        actor_id=actor_id,
        event_type=event_type,
        details=details or {},
        message=message,
    )

    db.add(audit)

    await db.flush()

    return audit
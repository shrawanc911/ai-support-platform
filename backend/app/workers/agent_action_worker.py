import asyncio
import json
from datetime import datetime, timezone

from sqlalchemy import select

from app.ai.agent.action_enums import AgentActionStatus
from app.ai.agent.action_service import AgentActionService
from app.ai.agent.action_queue import (
    AGENT_ACTION_QUEUE_NAME,
    requeue_agent_action,
)
from app.ai.agent.action_service import create_audit_log
from app.ai.agent.events import publish_action_event
from app.core.database import AsyncSessionLocal
from app.core.redis import redis_client
from app.core.audit_enums import AuditEventType
from app.models.agent_action import AgentAction


action_service = AgentActionService()


async def process_action(action_id: str):
    async with AsyncSessionLocal() as db:

        action = await db.scalar(
            select(AgentAction).where(
                AgentAction.id == action_id,
            )
        )

        if action is None:
            print(
                f"[ACTION WORKER] Action {action_id} not found"
            )
            return

        # Idempotency
        if action.status == AgentActionStatus.EXECUTED:
            print(
                f"[ACTION WORKER] Action {action_id} "
                "already executed"
            )
            return

        # Rejected actions must never execute
        if action.status == AgentActionStatus.REJECTED:
            print(
                f"[ACTION WORKER] Action {action_id} rejected"
            )
            return

        # Prevent duplicate processing
        if action.status == AgentActionStatus.PROCESSING:
            print(
                f"[ACTION WORKER] Action {action_id} "
                "already processing"
            )
            return

        # Only approved actions can execute
        if action.status != AgentActionStatus.APPROVED:
            print(
                f"[ACTION WORKER] Action {action_id} "
                f"has invalid status {action.status}"
            )
            return

        # Maximum retry check
        if action.attempts >= action.max_attempts:
            action.status = AgentActionStatus.FAILED
            action.error_message = (
                "Maximum retry attempts exceeded"
            )

            await db.commit()

            await create_audit_log(
                db=db,
                organization_id=action.organization_id,
                ticket_id=action.ticket_id,
                action_id=action.id,
                actor_id=action.approved_by_id,
                event_type=AuditEventType.ACTION_FAILED,
                details={
                    "attempt": action.attempts,
                    "error": str(exc),
                },
                message="Agent action execution failed.",
            )

            await publish_action_event(
                action.id,
                "FAILED",
                {
                    "error": action.error_message,
                },
            )
            print(
                f"[ACTION WORKER] Action {action_id} "
                "exceeded maximum attempts"
            )

            return

        # Mark as processing
        action.status = AgentActionStatus.PROCESSING
        action.attempts += 1
        action.started_at = datetime.now(timezone.utc)

        await create_audit_log(
            db=db,
            organization_id=action.organization_id,
            ticket_id=action.ticket_id,
            action_id=action.id,
            actor_id=action.approved_by_id,
            event_type=AuditEventType.ACTION_PROCESSING,
            details={
                "attempt": action.attempts,
            },
            message="Agent action processing started.",
        )

        await publish_action_event(
            action.id,
            "PROCESSING",
            {
                "attempt": action.attempts,
            },
        )

        await db.commit()

        try:

            await action_service.execute_action(
                db=db,
                action=action,
            )

            print(
                f"[ACTION WORKER] Action {action_id} "
                "executed successfully"
            )

            action.status = AgentActionStatus.EXECUTED
            action.executed_at = datetime.utcnow()
            action.error_message = None

            await create_audit_log(
                db=db,
                organization_id=action.organization_id,
                ticket_id=action.ticket_id,
                action_id=action.id,
                actor_id=action.approved_by_id,
                event_type=AuditEventType.ACTION_EXECUTED,
                details={
                    "attempt": action.attempts,
                },
                message="Agent action executed successfully.",
            )

            await publish_action_event(
                action.id,
                "EXECUTED",
                {
                    "executed_at": action.executed_at.isoformat(),
                },
            )

        except Exception as exc:

            await db.rollback()

            # Reload action after rollback
            action = await db.scalar(
                select(AgentAction).where(
                    AgentAction.id == action_id,
                )
            )

            if action is None:
                print(
                    f"[ACTION WORKER] Action {action_id} "
                    "disappeared after failure"
                )
                return

            action.error_message = str(exc)

            if action.attempts >= action.max_attempts:

                action.status = AgentActionStatus.FAILED

                await db.commit()

                print(
                    f"[ACTION WORKER] Action {action_id} "
                    f"failed permanently: {exc}"
                )

            else:

                action.status = AgentActionStatus.APPROVED

                await db.commit()

                delay = 2 ** action.attempts

                await requeue_agent_action(
                    action.id,
                    delay_seconds=delay,
                )

                print(
                    f"[ACTION WORKER] Action {action_id} "
                    f"failed. Retrying in {delay}s: {exc}"
                )


async def worker_loop():

    print(
        "[ACTION WORKER] Started"
    )

    while True:

        result = await redis_client.blpop(
            AGENT_ACTION_QUEUE_NAME,
            timeout=5,
        )

        if result is None:
            continue

        _, raw_payload = result

        try:

            payload = json.loads(raw_payload)

            action_id = payload["action_id"]

            print(
                f"[ACTION WORKER] Received {action_id}"
            )

            await process_action(action_id)

        except json.JSONDecodeError as exc:

            # Invalid queue message.
            # There is no reliable action_id to retry.
            print(
                f"[ACTION WORKER] Invalid queue payload: {exc}"
            )

        except KeyError as exc:

            # Missing required field.
            print(
                f"[ACTION WORKER] Invalid queue payload. "
                f"Missing field: {exc}"
            )

        except Exception as exc:

            # Unexpected worker-level error.
            # process_action() handles action execution
            # failures and retries itself.
            print(
                f"[ACTION WORKER] Queue processing error: {exc}"
            )


if __name__ == "__main__":
    asyncio.run(worker_loop())
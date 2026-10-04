from uuid import UUID
import asyncio
import json

from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent.action_schemas import (
    AgentActionRejectRequest,
    AgentActionResponse,
)
from app.ai.agent.action_enums import AgentActionStatus
from app.ai.agent.action_schemas import AuditLogResponse
from app.ai.agent.action_service import AgentActionService
from app.ai.agent.events import action_channel
from app.core.dependencies import get_db, require_roles, get_current_user
from app.core.redis import redis_client
from app.models.agent_action import AgentAction
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole


router = APIRouter(
    prefix="/ai/agent/actions",
    tags=["AI Agent Actions"],
)

action_service = AgentActionService()


APPROVER_ROLES = {
    UserRole.AGENT,
    UserRole.MANAGER,
    UserRole.ADMIN,
}

@router.get(
    "/{action_id}",
    response_model=AgentActionResponse,
)
async def get_action(
    action_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    action = await action_service.get_action(
        db=db,
        organization_id=current_user.organization_id,
        action_id=action_id,
    )

    if action is None:
        raise HTTPException(
            status_code=404,
            detail="Action not found",
        )

    return action

@router.get(
    "",
    response_model=list[AgentActionResponse],
)
async def list_actions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        )
    ),
):
    result = await db.scalars(
        select(
            AgentAction
        ).where(
            AgentAction.organization_id
            == current_user.organization_id,
            AgentAction.status
            == AgentActionStatus.PENDING,
        ).order_by(
            AgentAction.created_at.desc()
        )
    )

    return list(result.all())

@router.post(
    "/{action_id}/approve",
    response_model=AgentActionResponse,
    status_code=202
)
async def approve_action(
    action_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        )
    ),
):
    action = await action_service.get_action(
        db=db,
        organization_id=current_user.organization_id,
        action_id=action_id,
    )

    if action is None:
        raise HTTPException(
            status_code=404,
            detail="Action not found",
        )

    try:
        action = await action_service.approve_action(
            db=db,
            action=action,
            approver=current_user,
        )

        return action

    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

@router.post(
    "/{action_id}/reject",
    response_model=AgentActionResponse,
)
async def reject_action(
    action_id: UUID,
    request: AgentActionRejectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        )
    ),
):
    action = await action_service.get_action(
        db=db,
        organization_id=current_user.organization_id,
        action_id=action_id,
    )

    if action is None:
        raise HTTPException(
            status_code=404,
            detail="Action not found",
        )

    try:
        return await action_service.reject_action(
            db=db,
            action=action,
            approver=current_user,
            reason=request.reason,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

@router.get(
    "/{action_id}/audit",
    response_model=list[AuditLogResponse],
)
async def get_action_audit(
    action_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        )
    ),
):
    action = await action_service.get_action(
        db=db,
        organization_id=current_user.organization_id,
        action_id=action_id,
    )

    if action is None:
        raise HTTPException(
            status_code=404,
            detail="Action not found",
        )

    result = await db.scalars(
        select(AuditLog)
        .where(
            AuditLog.action_id == action_id,
            AuditLog.organization_id
            == current_user.organization_id,
        )
        .order_by(
            AuditLog.created_at.asc()
        )
    )

    return list(result.all())


@router.get("/{action_id}/events")
async def action_events(
    action_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    action = await action_service.get_action(
        db=db,
        organization_id=current_user.organization_id,
        action_id=action_id,
    )

    if action is None:
        raise HTTPException(
            status_code=404,
            detail="Action not found",
        )

    async def event_stream():
        pubsub = redis_client.pubsub()

        await pubsub.subscribe(
            action_channel(action_id)
        )

        try:
            while True:

                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=5,
                )

                if message:
                    yield (
                        f"data: {message['data']}\n\n"
                    )

                else:
                    yield ": heartbeat\n\n"

                await asyncio.sleep(0.1)

        finally:
            await pubsub.unsubscribe(
                action_channel(action_id)
            )
            await pubsub.close()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get(
    "/ticket/{ticket_id}/audit",
    response_model=list[AuditLogResponse],
)
async def get_ticket_audit(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        )
    ),
):
    result = await db.scalars(
        select(AuditLog)
        .where(
            AuditLog.ticket_id == ticket_id,
            AuditLog.organization_id
            == current_user.organization_id,
        )
        .order_by(
            AuditLog.created_at.asc()
        )
    )

    return list(result.all())
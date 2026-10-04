from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent.action_schemas import (
    AgentActionRejectRequest,
    AgentActionResponse,
)
from app.ai.agent.action_service import AgentActionService
from app.core.dependencies import get_db, require_roles, get_current_user
from app.models.user import User, UserRole
from app.models.agent_action import AgentAction
from app.ai.agent.action_enums import AgentActionStatus


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

        from app.ai.agent.action_queue import enqueue_agent_action
        await enqueue_agent_action(action.id)

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


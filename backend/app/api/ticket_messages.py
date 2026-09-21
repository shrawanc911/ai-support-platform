from uuid import UUID
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_roles
from app.schemas.ticket_message import (
    TicketMessageCreate,
    TicketMessageListResponse,
    TicketMessageResponse,
)
from app.services.ticket_message_service import TicketMessageService
from app.models.user import User, UserRole

router = APIRouter(
    prefix="/tickets",
    tags=["Ticket Messages"],
)


@router.post(
    "/{ticket_id}/messages",
    response_model=TicketMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ticket_message(
    ticket_id: UUID,
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.MANAGER,
                UserRole.AGENT,
                UserRole.CUSTOMER
            )
        )
    ],
    data: TicketMessageCreate,
    db: AsyncSession = Depends(get_db),
):
    return await TicketMessageService.create(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user,
        data=data,
    )


@router.get(
    "/{ticket_id}/messages",
    response_model=TicketMessageListResponse,
)
async def list_ticket_messages(
    ticket_id: UUID,
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.MANAGER,
                UserRole.AGENT,
                UserRole.CUSTOMER
            )
        )
    ],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await TicketMessageService.list_messages(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user,
        page=page,
        limit=limit,
    )
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.openrouter_provider import (
    OpenRouterProvider,
)
from app.ai.service import TicketAIService
from app.core.authorization import (
    ensure_ticket_access,
)
from app.core.dependencies import (
    get_current_user,
)
from app.core.dependencies import get_db
from app.models.ticket import Ticket
from app.models.user import User


router = APIRouter(
    prefix="/tickets",
    tags=["Ticket AI"],
)

@router.post("/{ticket_id}/ai/analyze")
async def analyze_ticket(
    ticket_id: UUID,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    db: AsyncSession = Depends(get_db),
):
    ticket = await db.scalar(
        select(Ticket).where(
            Ticket.id == ticket_id,
            Ticket.organization_id
            == current_user.organization_id,
        )
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    ensure_ticket_access(
        current_user,
        ticket,
    )

    service = TicketAIService(
        OpenRouterProvider()
    )

    return await service.analyze_ticket(
        db,
        ticket,
    )
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.dashboard import UserDashboardResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus
from app.core.dependencies import require_roles,get_db

router = APIRouter(prefix="/dashboard",tags=["Dashboard"])

@router.get("",)
async def getUserDashboard(
    current_user:Annotated[
        User,
        Depends(
            require_roles(
                UserRole.CUSTOMER,
                UserRole.ADMIN,
                UserRole.AGENT,
                UserRole.MANAGER
            )
        )
    ],
    db:AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(Ticket)
            .where(Ticket.customer_id == current_user.id)
            .order_by(Ticket.updated_at.desc())
        )
        tickets = result.scalars().all()

        stats = {
            "open": 0,
            "in_progress": 0,
            "waiting_for_customer": 0,
            "resolved": 0,
            "closed": 0,
        }

        for ticket in tickets:
            if ticket.status == TicketStatus.OPEN:
                stats["open"] += 1

            elif ticket.status == TicketStatus.IN_PROGRESS:
                stats["in_progress"] += 1

            elif ticket.status == TicketStatus.WAITING_FOR_CUSTOMER:
                stats["waiting_for_customer"] += 1

            elif ticket.status == TicketStatus.RESOLVED:
                stats["resolved"] += 1

            elif ticket.status == TicketStatus.CLOSED:
                stats["closed"] += 1

        recent_tickets = tickets[:5]

        return UserDashboardResponse(
            stats=stats,
            recent_tickets=recent_tickets,
        )
    except Exception as exc:
        message = str(exc)

        raise HTTPException(
            status_code=500,
            detail=message
        )
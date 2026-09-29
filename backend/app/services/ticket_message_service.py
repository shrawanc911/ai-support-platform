from math import ceil
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func,select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import Ticket
from app.models.ticket_message import TicketMessage, MessageType
from app.schemas.ticket_message import (TicketMessageCreate,TicketMessageListResponse) 
from app.models.user import User, UserRole

class TicketMessageService:
    @staticmethod
    async def create(db:AsyncSession,ticket_id:UUID,current_user:User,data:TicketMessageCreate) -> TicketMessage:
        result = await db.execute(
            select(Ticket).where(Ticket.id==ticket_id,Ticket.customer_id==current_user.id)
        )
        ticket = result.scalar_one_or_none()
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        message_type = ""
        if current_user.role == UserRole.CUSTOMER:
            message_type = MessageType.CUSTOMER
        else:
            message_type = MessageType.AGENT
        message = TicketMessage(
            ticket_id=ticket_id,
            sender_id=current_user.id,
            message_type = message_type,
            content=data.content
        )

        db.add(message)
        await db.commit()
        await db.refresh(message)
        return message

    @staticmethod
    async def list_messages(db:AsyncSession,ticket_id:UUID,current_user:User,page:int=1,limit:int=50) -> TicketMessageListResponse:
        if page < 1:
            raise HTTPException(
                status_code=400,
                detail="Page must be greater than or equal to 1",
            )

        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=400,
                detail="Limit must be between 1 and 100",
            )

        # Verify ticket belongs to organization
        ticket_result = await db.execute(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.customer_id == current_user.id,
            )
        )

        ticket = ticket_result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

        base_query = select(TicketMessage).where(
            TicketMessage.ticket_id == ticket_id
        )

        count_query = select(
            func.count(TicketMessage.id)
        ).where(
            TicketMessage.ticket_id == ticket_id
        )

        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        result = await db.execute(
            base_query
            .order_by(TicketMessage.created_at.asc())
            .offset((page - 1) * limit)
            .limit(limit)
        )

        messages = result.scalars().all()

        pages = ceil(total / limit) if total else 0

        return {
            "items": messages,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
        }

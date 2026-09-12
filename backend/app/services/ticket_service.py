from uuid import UUID

from sqlalchemy import select , func
from sqlalchemy.ext.asyncio import AsyncSession


from app.models.organization import Organization
from app.models.ticket import (Ticket,TicketStatus,TicketPriority)
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.models.ticket_message import (
    MessageType,
    TicketMessage,
)

from app.core.exceptions import InvalidTicketTransitionError
from app.services.ticket_workflow import validate_status_transition

class TicketService:
    async def create(self, db:AsyncSession,data: TicketCreate) -> Ticket:
        # Verify organization
        organization = await db.scalar(select(Organization).where(Organization.id == data.organization_id))

        if organization is None:
            raise ValueError("Organization not found")

        # Verify customer
        customer = await db.scalar(
            select(User).
            where(
                User.id==data.customer_id,
                User.organization_id==data.organization_id
            )
        )

        if customer is None:
            raise ValueError("Customer does not belong to this organization")

        ticket = Ticket(
            organization_id=data.organization_id,
            customer_id=data.customer_id,
            subject=data.subject,
            description=data.description
        )

        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)

        return ticket

    async def get_by_id(self,db:AsyncSession,ticket_id:UUID,organization_id:UUID) -> Ticket | None :
        return await db.scalar(
            select(Ticket).
            where(Ticket.id==ticket_id,Ticket.organization_id==organization_id)
        )

    async def update(self,db:AsyncSession,ticket:Ticket,data:TicketUpdate) -> Ticket :
        old_status = ticket.status
        if data.status is not None and old_status != data.status:
            validate_status_transition(current_status=ticket.status,new_status=data.status)
            ticket.status = data.status
            system_message = TicketMessage(
                ticket_id=ticket.id,
                sender_id=None,
                message_type=MessageType.SYSTEM,
                content=(
                    f"Ticket status changed from "
                    f"{old_status.value} to "
                    f"{data.status.value}."
                )
            )
            db.add(system_message)

        if data.priority is not None:
            ticket.priority = data.priority

        await db.commit()
        await db.refresh(ticket)

        return ticket

    async def list(
            self,db:AsyncSession,
            organization_id:UUID,
            page:int=1,
            limit:int=20,
            status:TicketStatus|None = None,
            priority: TicketPriority | None = None
    )-> tuple[list[Ticket],int]:
        query = select(Ticket).where(Ticket.organization_id == organization_id)
        count_query = select(func.count()).select_from(Ticket).where(Ticket.organization_id==organization_id)

        if status is not None:
            query = query.where(Ticket.status==status)
            count_query = count_query.where(Ticket.status==status)

        if priority is not None:
            query = query.where(Ticket.priority == priority)
            count_query = count_query.where(Ticket.priority==priority)

        total = await db.scalar(count_query)
        offset = (page-1) * limit
        query = (
            query.
            order_by(Ticket.created_at.desc()).
            offset(offset).
            limit(limit)
        )
        result = await db.scalars(query)
        return list(result.all()), total or 0

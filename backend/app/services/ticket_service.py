from uuid import UUID

from sqlalchemy import select , func , or_
from sqlalchemy.ext.asyncio import AsyncSession


from app.models.organization import Organization
from app.models.ticket import (Ticket,TicketStatus,TicketPriority)
from app.models.user import User, UserRole
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.models.ticket_message import (
    MessageType,
    TicketMessage,
)

from app.core.exceptions import InvalidTicketTransitionError
from app.services.ticket_workflow import validate_status_transition

class TicketService:
    async def create(self, db:AsyncSession,data: TicketCreate,current_user: User) -> Ticket:
        # Verify organization
        organization = await db.scalar(select(Organization).where(Organization.id == current_user.organization_id))

        if organization is None:
            raise ValueError("Organization not found")

        # Verify customer
        customer = await db.scalar(
            select(User).
            where(
                User.id==current_user.id,
                User.organization_id==current_user.organization_id
            )
        )

        if customer is None:
            raise ValueError("Customer does not belong to this organization")

        ticket = Ticket(
            organization_id=current_user.organization_id,
            customer_id=current_user.id,
            subject=data.subject,
            description=data.description
        )

        

        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)
        message = TicketMessage(
            ticket_id=ticket.id,
            message_type ="SYSTEM",
            content=f"Hello {current_user.name}, can you share me more details about this ticket?"
        )

        db.add(message)
        await db.commit()
        await db.refresh(message)

        return ticket

    async def get_by_id(self,db:AsyncSession,ticket_id:UUID,current_user:User) -> Ticket | None :
        return await db.scalar(
            select(Ticket).
            where(
                Ticket.id==ticket_id,
                or_(
                    Ticket.customer_id==current_user.id, 
                    current_user.role != "CUSTOMER"
                )
            )
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
            self,
            db:AsyncSession,
            current_user:User,
            page:int=1,
            limit:int=20,
            status:TicketStatus|None = None,
            priority: TicketPriority | None = None,
            search : str | None = None
    )-> tuple[list[Ticket],int]:
        # Base filters
        filters = [Ticket.organization_id == current_user.organization_id]

        if current_user.role == UserRole.CUSTOMER:
            filters.append(
                Ticket.customer_id
                == current_user.id
            )
        # Status filter
        if status is not None:
            filters.append(Ticket.status == status)

        # Priority filter
        if priority is not None:
            filters.append(Ticket.priority == priority)

        # Search filter
        if search:
            search_pattern = f"%{search.strip()}%"

            filters.append(
                or_(
                    Ticket.subject.ilike(search_pattern),
                    Ticket.description.ilike(search_pattern),
                )
            )
            
        # Main query
        query = (
            select(Ticket)
            .where(*filters)
            .order_by(Ticket.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )

         # Count query
        count_query = (
            select(func.count(Ticket.id))
            .where(*filters)
        )

        # Execute count
        total = await db.scalar(count_query)

        # Execute tickets query
        result = await db.scalars(query)

        tickets = result.all()

        return list(tickets), total or 0

from uuid import UUID

from fastapi import APIRouter, Depends,HTTPException,status , Query
from app.core.exceptions import InvalidTicketTransitionError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.ticket import (TicketCreate, TicketUpdate, TicketResponse,TicketListResponse)
from app.services.ticket_service import TicketService
from app.models.ticket import (TicketPriority, TicketStatus)

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)

service = TicketService()

@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ticket(data:TicketCreate,db:AsyncSession = Depends(get_db)):
    try:
        return await service.create(db,data)
    except ValueError as exc:
        message = str(exc)

        if "Organization" in message:
            code = status.HTTP_404_NOT_FOUND
        else:
            code = status.HTTP_400_BAD_REQUEST

        raise HTTPException(
            status_code=code,
            detail=message
        )

@router.get("/{ticket_id}",response_model=TicketResponse)
async def get_ticket(ticket_id:UUID,organization_id:UUID,db:AsyncSession = Depends(get_db)):
    ticket = await service.get_by_id(db,ticket_id,organization_id)

    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Ticket not found")

    return ticket

@router.patch("/{ticket_id}",response_model=TicketResponse)
async def update_ticket(ticket_id:UUID,organization_id:UUID,data:TicketUpdate,db:AsyncSession=Depends(get_db)):
    try:
        ticket = await service.get_by_id(db,ticket_id,organization_id)

        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Ticket not found")

        return await service.update(db,ticket,data)
    except InvalidTicketTransitionError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

@router.get(
    "",
    response_model=TicketListResponse,
)
async def list_tickets(
    organization_id:UUID,
    page:int =1,
    limit:int = 20,
    status: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    search: str|None = Query(default=None,max_length=200),
    db:AsyncSession = Depends(get_db)
) -> TicketListResponse:
    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be greater than 0"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    tickets,total = await service.list(db,organization_id,page,limit,status,priority,search)
    pages = (total + limit - 1) // limit

    return {
        "items":tickets,
        "total":total,
        "page":page,
        "limit":limit,
        "pages":pages
    }

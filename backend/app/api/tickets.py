from uuid import UUID, uuid4
from typing import Annotated
from fastapi import APIRouter, Depends,HTTPException,status , Query
from app.core.exceptions import InvalidTicketTransitionError
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.core.dependencies import get_db,get_current_user,require_roles
from app.schemas.ticket import (TicketCreate, TicketUpdate, TicketResponse,TicketListResponse)
from app.services.ticket_service import TicketService
from app.models.ticket import (TicketPriority, TicketStatus)
from app.models.user import User, UserRole
from app.models.ticket_ai_analysis import TicketAIAnalysis
from app.core.config import settings
from app.ai.queue import enqueue_ticket_analysis


from sqlalchemy import select

from app.ai.providers.openrouter_provider import OpenRouterProvider
from app.ai.service import TicketAIService
from app.models.ticket import Ticket

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)

service = TicketService()

# @router.get("/x/{ticket_id}")
# async def x(ticket_id:UUID,db:AsyncSession = Depends(get_db)):
#     await enqueue_ticket_analysis(uuid4(),ticket_id,"TICKET_ANALYSIS_QUEUE")
#     return "Done"

@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ticket(
    data:TicketCreate,
    current_user: Annotated[
        User,
        Depends(require_roles(
            UserRole.CUSTOMER,
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.AGENT
            )
        ),
    ]
    ,db:AsyncSession = Depends(get_db)):
    try:
        return await service.create(db,data,current_user)
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
async def get_ticket(
    ticket_id:UUID,
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.CUSTOMER,
                UserRole.ADMIN,
                UserRole.MANAGER,
                UserRole.AGENT
            )
        ),
    ],
    db:AsyncSession = Depends(get_db)
    ):
    ticket = await service.get_by_id(db,ticket_id,current_user)

    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Ticket not found")

    return ticket

@router.patch("/{ticket_id}",response_model=TicketResponse)
async def update_ticket(
    ticket_id:UUID,
    data:TicketUpdate,
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.AGENT,
                UserRole.MANAGER,
                UserRole.ADMIN
            )
        )
    ],
    db:AsyncSession=Depends(get_db)):
    try:
        ticket = await service.get_by_id(db,ticket_id,current_user)

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
    current_user: Annotated[
        User,
        Depends(require_roles(
            UserRole.CUSTOMER,
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.AGENT
            )
        ),
    ],
    page:int = Query(default=1,ge=1),
    limit:int = Query(default=20,ge=1,le=100),
    status: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    search: str|None = Query(default=None,max_length=200),
    db:AsyncSession = Depends(get_db)
) -> TicketListResponse:

    tickets,total = await service.list(db,current_user,page,limit,status,priority,search)
    pages = (total + limit - 1) // limit

    return {
        "items":tickets,
        "total":total,
        "page":page,
        "limit":limit,
        "pages":pages
    }

@router.get("/admin/{ticket_id}/get_ai_analysis")
async def get_ticket_ai_analysis(ticket_id: UUID,current_user: Annotated[User,Depends(require_roles(UserRole.ADMIN))], db: AsyncSession = Depends(get_db)):
    result = await db.scalar(select(TicketAIAnalysis).where(TicketAIAnalysis.ticket_id == ticket_id).order_by(TicketAIAnalysis.created_at.desc()).limit(1))
    return result
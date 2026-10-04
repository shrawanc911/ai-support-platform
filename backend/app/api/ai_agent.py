from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ai.agent.service import AIAgentService
from app.core.dependencies import get_current_user
from app.core.dependencies import get_db
from app.models.user import User
from app.models.ticket import Ticket

router = APIRouter(
    prefix="/ai/agent",
    tags=["AI Agent"],
)

class AgentRunRequest(BaseModel):
    ticket_id: UUID
    message: str

@router.post("/run")
async def run_agent(
    request: AgentRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = await db.scalar(
        select(Ticket).where(
            Ticket.id == request.ticket_id,
            Ticket.organization_id
            == current_user.organization_id,
        )
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )
    service = AIAgentService()

    user_message = f"""
        Current support ticket:

        Ticket ID:
        {ticket.id}

        Subject:
        {ticket.subject}

        Description:
        {ticket.description}

        Agent request:
        {request.message}
        """.strip()

    return await service.run(
        db=db,
        organization_id=current_user.organization_id,
        user_message=user_message
    )

class AgentToolRequest(BaseModel):
    tool_name: str
    arguments: dict = {}


@router.post("/tools/execute")
async def execute_agent_tool(
    request: AgentToolRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AIAgentService()

    return await service.execute_tool(
        db=db,
        organization_id=current_user.organization_id,
        tool_name=request.tool_name,
        arguments=request.arguments,
    )
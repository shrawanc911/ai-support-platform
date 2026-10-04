from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent.service import AIAgentService
from app.core.dependencies import get_current_user
from app.core.dependencies import get_db
from app.models.user import User


router = APIRouter(
    prefix="/ai/agent",
    tags=["AI Agent"],
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
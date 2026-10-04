from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent.registry import AgentToolRegistry
from app.ai.agent.schemas import AgentToolResult


class AIAgentService:

    def __init__(self):
        self.registry = AgentToolRegistry()

    async def execute_tool(
        self,
        db: AsyncSession,
        organization_id,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> AgentToolResult:

        tool = self.registry.get(tool_name)

        try:
            data = await tool.execute(
                db=db,
                organization_id=organization_id,
                arguments=arguments,
            )

            return AgentToolResult(
                tool_name=tool_name,
                success=True,
                data=data,
            )

        except Exception as exc:
            return AgentToolResult(
                tool_name=tool_name,
                success=False,
                data={
                    "error": str(exc),
                },
            )
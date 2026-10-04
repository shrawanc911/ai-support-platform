import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent.context import AgentContext
from app.ai.agent.prompts import SYSTEM_PROMPT
from app.ai.agent.registry import AgentToolRegistry
from app.ai.agent.schemas import (
    AgentFinalResponse,
    AgentToolResult,
)
from app.ai.providers.openrouter_provider import OpenRouterProvider
from app.core.config import settings


class AIAgentService:

    def __init__(
        self,
        provider=None,
    ):
        self.provider = (
            provider
            or OpenRouterProvider()
        )

        self.registry = AgentToolRegistry()

    async def execute_tool(
        self,
        db: AsyncSession,
        context:AgentContext,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> AgentToolResult:

        tool = self.registry.get(tool_name)

        try:
            data = await tool.execute(
                db=db,
                contex=context,
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

    async def run(
        self,
        db: AsyncSession,
        context:AgentContext,
        user_message: str,
    ) -> AgentFinalResponse:

        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_message,
            },
        ]

        tools = self.registry.definitions()

        tools_used: list[str] = []
        tool_call_count = 0

        for _ in range(
            settings.AI_AGENT_MAX_ITERATIONS
        ):
            response = await self.provider.agent_completion(
                messages=messages,
                tools=tools,
            )

            message = response.choices[0].message

            if not message.tool_calls:
                return self._build_final_response(
                    message.content,
                    tools_used,
                )

            assistant_message = {
                "role": "assistant",
                "content": message.content,
                "tool_calls": [],
            }

            for tool_call in message.tool_calls:
                assistant_message["tool_calls"].append(
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments,
                        },
                    }
                )

            messages.append(assistant_message)

            for tool_call in message.tool_calls:

                tool_call_count += 1

                if (
                    tool_call_count
                    > settings.AI_AGENT_MAX_TOOL_CALLS
                ):
                    return AgentFinalResponse(
                        answer=(
                            "The AI agent reached its tool "
                            "execution limit. Please review "
                            "the ticket manually."
                        ),
                        confidence=0.0,
                        tools_used=tools_used,
                    )

                tool_name = (
                    tool_call.function.name
                )

                try:
                    arguments = json.loads(
                        tool_call.function.arguments
                    )
                except json.JSONDecodeError:
                    arguments = {}

                result = await self.execute_tool(
                    db=db,
                    context=context,
                    tool_name=tool_name,
                    arguments=arguments,
                )

                tools_used.append(tool_name)

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(
                            result.data,
                            default=str,
                        ),
                    }
                )

        return AgentFinalResponse(
            answer=(
                "The AI agent could not complete the "
                "analysis within the allowed number "
                "of steps."
            ),
            confidence=0.0,
            tools_used=tools_used,
        )

    def _build_final_response(
        self,
        content: str | None,
        tools_used: list[str],
    ) -> AgentFinalResponse:

        if not content:
            content = (
                "The AI agent did not return a final answer."
            )

        return AgentFinalResponse(
            answer=content,
            confidence=0.8 if tools_used else 0.5,
            tools_used=tools_used,
        )
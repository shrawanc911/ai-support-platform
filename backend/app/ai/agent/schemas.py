from typing import Any

from pydantic import BaseModel, Field


class AgentToolCall(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class AgentToolResult(BaseModel):
    tool_name: str
    success: bool
    data: Any


class AgentResponse(BaseModel):
    answer: str
    tools_used: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)
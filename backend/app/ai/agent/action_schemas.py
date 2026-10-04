from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.ai.agent.action_enums import (
    AgentActionStatus,
    AgentActionType,
)


class AgentActionCreate(BaseModel):
    action_type: AgentActionType
    payload: dict

class AgentActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    ticket_id: UUID

    requested_by_id: UUID
    approved_by_id: UUID | None

    action_type: AgentActionType
    status: AgentActionStatus

    payload: dict

    attempts: int
    max_attempts: int

    error_message: str | None

    created_at: datetime
    started_at: datetime | None
    approved_at: datetime | None
    executed_at: datetime | None

class AgentActionRejectRequest(BaseModel):
    reason: str = Field(
        min_length=3,
        max_length=1000,
    )
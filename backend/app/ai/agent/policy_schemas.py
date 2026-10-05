from pydantic import BaseModel, Field

from app.ai.agent.policy_enums import ActionDecision, ActionRisk


class PolicyDecision(BaseModel):
    decision: ActionDecision
    risk: ActionRisk
    reason: str = Field(min_length=1)
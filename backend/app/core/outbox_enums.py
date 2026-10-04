from enum import Enum


class OutboxEventType(str, Enum):
    AGENT_ACTION_APPROVED = "AGENT_ACTION_APPROVED"


class OutboxEventStatus(str, Enum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"
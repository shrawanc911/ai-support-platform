from enum import Enum


class AgentActionType(str, Enum):
    CHANGE_TICKET_STATUS = "CHANGE_TICKET_STATUS"
    ASSIGN_TICKET = "ASSIGN_TICKET"
    ADD_INTERNAL_NOTE = "ADD_INTERNAL_NOTE"


class AgentActionStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"
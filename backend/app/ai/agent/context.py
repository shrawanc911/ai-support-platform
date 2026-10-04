from dataclasses import dataclass
from uuid import UUID


@dataclass
class AgentContext:
    organization_id: UUID
    ticket_id: UUID | None = None
    customer_id: UUID | None = None
    requested_by_id: UUID | None = None
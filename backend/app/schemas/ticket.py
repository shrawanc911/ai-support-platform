from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.ticket import TicketPriority, TicketStatus

class TicketCreate(BaseModel):
    subject: str = Field(
        min_length=3,
        max_length=500
    )

    description:str = Field(
        min_length=1
    )

class TicketUpdate(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None

class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    customer_id: UUID
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime

class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total:int
    page:int
    limit:int
    pages:int
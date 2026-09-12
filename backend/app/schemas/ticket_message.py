from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.ticket_message import MessageType

class TicketMessageCreate(BaseModel):
    sender_id:UUID |None = None
    message_type:MessageType
    content: str = Field(
        min_length=1,
        max_length=10000
    )

class TicketMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:UUID
    ticket_id:UUID
    sender_id:UUID | None
    message_type: MessageType
    content: str
    created_at:datetime

class TicketMessageListResponse(BaseModel):
    items: list[TicketMessageResponse]
    total:int
    page:int
    limit:int
    pages:int
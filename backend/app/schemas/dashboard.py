from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.ticket import TicketPriority, TicketStatus


class DashboardStats(BaseModel):
    open: int
    in_progress: int
    waiting_for_customer: int
    resolved: int
    closed: int


class DashboardTicket(BaseModel):
    id: UUID
    subject: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class UserDashboardResponse(BaseModel):
    stats: DashboardStats
    recent_tickets: list[DashboardTicket]
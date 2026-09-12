from app.models.ticket import TicketStatus
from app.core.exceptions import InvalidTicketTransitionError

ALLOWED_TRANSITIONS: dict[TicketStatus,set[TicketStatus]] = {
    TicketStatus.OPEN:{
        TicketStatus.AI_ANALYZING,
        TicketStatus.ASSIGNED,
        TicketStatus.IN_PROGRESS
    },
    TicketStatus.AI_ANALYZING:{
        TicketStatus.ASSIGNED,
        TicketStatus.IN_PROGRESS,
        TicketStatus.OPEN
    },
    TicketStatus.ASSIGNED:{
        TicketStatus.IN_PROGRESS,
        TicketStatus.OPEN
    },
    TicketStatus.IN_PROGRESS:{
        TicketStatus.WAITING_FOR_CUSTOMER,
        TicketStatus.RESOLVED
    },
    TicketStatus.WAITING_FOR_CUSTOMER:{
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED
    },
    TicketStatus.RESOLVED:{
        TicketStatus.IN_PROGRESS,
        TicketStatus.CLOSED
    },
    TicketStatus.CLOSED: set(),
}

def validate_status_transition(current_status:TicketStatus,new_status:TicketStatus) -> None:
    if current_status == new_status:
        return
    allowed_statuses = ALLOWED_TRANSITIONS.get(current_status,set())
    if new_status not in allowed_statuses:
        raise InvalidTicketTransitionError(
            current_status=current_status.value,
            new_status=new_status.value,
        )
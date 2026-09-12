import pytest

from app.core.exceptions import InvalidTicketTransitionError
from app.models.ticket import TicketStatus
from app.services.ticket_workflow import (
    validate_status_transition,
)


def test_valid_ticket_transition():
    validate_status_transition(
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
    )


def test_invalid_ticket_transition():
    with pytest.raises(InvalidTicketTransitionError):
        validate_status_transition(
            TicketStatus.CLOSED,
            TicketStatus.IN_PROGRESS,
        )
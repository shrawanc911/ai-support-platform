from fastapi import HTTPException, status

from app.models.ticket import Ticket
from app.models.user import User, UserRole


def can_access_ticket(
    user: User,
    ticket: Ticket,
) -> bool:

    if (
        ticket.organization_id
        != user.organization_id
    ):
        return False

    if user.role == UserRole.CUSTOMER:
        return (
            ticket.customer_id
            == user.id
        )

    return user.role in {
        UserRole.AGENT,
        UserRole.MANAGER,
        UserRole.ADMIN,
    }


def ensure_ticket_access(
    user: User,
    ticket: Ticket,
) -> None:

    if not can_access_ticket(
        user,
        ticket,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )
from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag import RAGService
from app.knowledge.service import KnowledgeService
from app.models.ticket import Ticket
from app.models.ticket_message import TicketMessage
from app.models.user import User


class AgentTool(ABC):
    name: str
    description: str

    @abstractmethod
    async def execute(
        self,
        db: AsyncSession,
        organization_id,
        arguments: dict[str, Any],
    ) -> Any:
        raise NotImplementedError


class SearchKnowledgeTool(AgentTool):
    name = "search_knowledge"

    description = (
        "Search the organization's knowledge base for policies, "
        "procedures, product information, and support documentation."
    )

    def __init__(self):
        self.rag = RAGService(KnowledgeService())

    async def execute(
        self,
        db: AsyncSession,
        organization_id,
        arguments: dict[str, Any],
    ) -> Any:
        query = arguments.get("query")

        if not query:
            raise ValueError("query is required")

        results = await self.rag.retrieve(
            db=db,
            organization_id=organization_id,
            query=query,
            limit=5,
        )

        return [
            {
                "document_id": result["document_id"],
                "document_title": result["document_title"],
                "chunk_id": result["chunk_id"],
                "chunk_index": result["chunk_index"],
                "content": result["content"],
                "similarity": result["similarity"],
            }
            for result in results
        ]


class SearchTicketHistoryTool(AgentTool):
    name = "search_ticket_history"

    description = (
        "Search previous messages from the current support ticket "
        "to understand the conversation history."
    )

    async def execute(
        self,
        db: AsyncSession,
        organization_id,
        arguments: dict[str, Any],
    ) -> Any:

        ticket_id = arguments.get("ticket_id")

        if not ticket_id:
            raise ValueError("ticket_id is required")

        ticket = await db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.organization_id == organization_id,
            )
        )

        if not ticket:
            raise ValueError("Ticket not found")

        messages = (
            await db.scalars(
                select(TicketMessage)
                .where(
                    TicketMessage.ticket_id == ticket.id,
                )
                .order_by(TicketMessage.created_at.asc())
            )
        ).all()

        return [
            {
                "message_id": str(message.id),
                "sender_id": (
                    str(message.sender_id)
                    if message.sender_id
                    else None
                ),
                "message_type": message.message_type,
                "content": message.content,
                "created_at": message.created_at.isoformat(),
            }
            for message in messages
        ]


class GetCustomerTool(AgentTool):
    name = "get_customer"

    description = (
        "Get basic information about the customer associated "
        "with the current ticket."
    )

    async def execute(
        self,
        db: AsyncSession,
        organization_id,
        arguments: dict[str, Any],
    ) -> Any:

        customer_id = arguments.get("customer_id")

        if not customer_id:
            raise ValueError("customer_id is required")

        customer = await db.scalar(
            select(User).where(
                User.id == customer_id,
                User.organization_id == organization_id,
            )
        )

        if not customer:
            raise ValueError("Customer not found")

        return {
            "id": str(customer.id),
            "name": customer.name,
            "email": customer.email,
            "role": customer.role,
            "is_active": customer.is_active,
        }

class GetOrderTool(AgentTool):
    name = "get_order"

    description = (
        "Retrieve order information when an order ID is available."
    )

    async def execute(
        self,
        db: AsyncSession,
        organization_id,
        arguments: dict[str, Any],
    ) -> Any:
        raise NotImplementedError(
            "Order service is not implemented yet."
        )


class GetSubscriptionTool(AgentTool):
    name = "get_subscription"

    description = (
        "Retrieve subscription information when a subscription "
        "ID is available."
    )

    async def execute(
        self,
        db: AsyncSession,
        organization_id,
        arguments: dict[str, Any],
    ) -> Any:
        raise NotImplementedError(
            "Subscription service is not implemented yet."
        )
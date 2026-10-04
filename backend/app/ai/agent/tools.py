from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag import RAGService
from app.knowledge.service import KnowledgeService
from app.models.ticket import Ticket
from app.models.ticket_message import TicketMessage
from app.models.user import User
from app.orders.service import OrderService
from app.subscriptions.service import SubscriptionService


class AgentTool(ABC):
    name: str
    description: str

    @abstractmethod
    async def execute(
        self,
        db: AsyncSession,
        context,
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
        context,
        arguments: dict[str, Any],
    ) -> Any:
        query = arguments.get("query")

        if not query:
            raise ValueError("query is required")

        results = await self.rag.retrieve(
            db=db,
            organization_id=context.organization_id,
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
        context,
        arguments: dict[str, Any],
    ) -> Any:

        if not context.ticket_id:
            raise ValueError(
                "No current ticket is available"
            )

        ticket = await db.scalar(
            select(Ticket).where(
                Ticket.id == context.ticket_id,
                Ticket.organization_id
                == context.organization_id,
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
        "Retrieve information about the customer "
        "associated with the current ticket."
    )

    async def execute(
        self,
        db: AsyncSession,
        context,
        arguments: dict[str, Any],
    ) -> Any:

        if not context.customer_id:
            raise ValueError(
                "No customer is associated with this ticket"
            )

        customer = await db.scalar(
            select(User).where(
                User.id == context.customer_id,
                User.organization_id
                == context.organization_id,
            )
        )

        if not customer:
            raise ValueError(
                "Customer not found"
            )

        return {
            "id": str(customer.id),
            "name": customer.name,
            "email": customer.email,
            "is_active": customer.is_active,
        }

class GetOrderTool(AgentTool):

    name = "get_order"

    description = (
        "Retrieve order information for the current customer."
    )

    def __init__(self):
        self.service = OrderService()

    async def execute(
        self,
        db: AsyncSession,
        context,
        arguments: dict[str, Any],
    ) -> Any:

        customer_id = context.customer_id

        if not customer_id:
            raise ValueError(
                "customer_id is required"
            )

        order_id = arguments.get("order_id")
        order_number = arguments.get("order_number")

        if not order_id and not order_number:
            raise ValueError(
                "order_id or order_number is required"
            )

        order = await self.service.get_customer_order(
            db=db,
            organization_id=organization_id,
            customer_id=customer_id,
            order_id=order_id,
            order_number=order_number,
        )

        if not order:
            raise ValueError(
                "Order not found"
            )

        return {
            "id": str(order.id),
            "order_number": order.order_number,
            "status": order.status,
            "total_amount": float(
                order.total_amount
            ),
            "currency": order.currency,
            "created_at": (
                order.created_at.isoformat()
            ),
        }

class GetSubscriptionTool(AgentTool):

    name = "get_subscription"

    description = (
        "Retrieve subscription information for the current customer."
    )

    def __init__(self):
        self.service = SubscriptionService()

    async def execute(
        self,
        db: AsyncSession,
        organization_id,
        arguments: dict[str, Any],
    ) -> Any:

        customer_id = arguments.get("customer_id")

        if not customer_id:
            raise ValueError(
                "customer_id is required"
            )

        subscription_id = arguments.get(
            "subscription_id"
        )

        subscription = (
            await self.service
            .get_customer_subscription(
                db=db,
                organization_id=organization_id,
                customer_id=customer_id,
                subscription_id=subscription_id,
            )
        )

        if not subscription:
            raise ValueError(
                "Subscription not found"
            )

        return {
            "id": str(subscription.id),
            "plan_name": subscription.plan_name,
            "status": subscription.status,
            "renewal_date": (
                subscription.renewal_date.isoformat()
                if subscription.renewal_date
                else None
            ),
        }
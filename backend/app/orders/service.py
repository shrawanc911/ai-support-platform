from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order


class OrderService:

    async def get_customer_order(
        self,
        db: AsyncSession,
        organization_id: UUID,
        customer_id: UUID,
        order_id: UUID | None = None,
        order_number: str | None = None,
    ) -> Order | None:

        statement = select(Order).where(
            Order.organization_id == organization_id,
            Order.customer_id == customer_id,
        )

        if order_id:
            statement = statement.where(
                Order.id == order_id
            )

        if order_number:
            statement = statement.where(
                Order.order_number == order_number
            )

        return await db.scalar(statement)
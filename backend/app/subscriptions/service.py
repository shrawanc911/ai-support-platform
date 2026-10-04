from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import Subscription


class SubscriptionService:

    async def get_customer_subscription(
        self,
        db: AsyncSession,
        organization_id: UUID,
        customer_id: UUID,
        subscription_id: UUID | None = None,
    ) -> Subscription | None:

        statement = select(
            Subscription
        ).where(
            Subscription.organization_id
            == organization_id,
            Subscription.customer_id
            == customer_id,
        )

        if subscription_id:
            statement = statement.where(
                Subscription.id
                == subscription_id
            )

        return await db.scalar(statement)
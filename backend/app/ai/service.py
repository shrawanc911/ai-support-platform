from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.base import AIProvider
from app.models.ticket import Ticket
from app.models.ticket_ai_analysis import TicketAIAnalysis
from app.core.config import settings


class TicketAIService:

    def __init__(
        self,
        provider: AIProvider,
    ):
        self.provider = provider

    async def analyze_ticket(
        self,
        db: AsyncSession,
        ticket: Ticket,
    ) -> TicketAIAnalysis:

        result = await self.provider.analyze_ticket(
            subject=ticket.subject,
            description=ticket.description,
        )

        analysis = TicketAIAnalysis(
            ticket_id=ticket.id,
            category=result.category.value,
            priority=result.priority.value,
            sentiment=result.sentiment.value,
            summary=result.summary,
            suggested_response=result.suggested_response,
            confidence=result.confidence,
            evidence_summary=result.evidence_summary,
            model=settings.OPENROUTER_MODEL,
            prompt_version="v1",
        )

        db.add(analysis)

        await db.commit()
        await db.refresh(analysis)

        return analysis
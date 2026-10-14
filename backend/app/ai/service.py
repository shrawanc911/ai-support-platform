from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.ai.providers.openrouter_provider import OpenRouterProvider
from app.ai.rag import RAGService, build_rag_context
from app.ai.providers.openrouter_provider import OpenRouterProvider
from app.knowledge.service import KnowledgeService
from app.models.ai_source import AISource
from app.models.ticket import Ticket
from app.models.ticket_ai_analysis import TicketAIAnalysis
from app.core.config import settings


class TicketAIService:

    def __init__(
        self,
        provider: OpenRouterProvider,
    ):
        self.provider = provider
        self.rag = RAGService(KnowledgeService())

    async def analyze_ticket(
        self,
        db: AsyncSession,
        ticket: Ticket,
        job
    ) -> TicketAIAnalysis:

        rag_query = self.build_ticket_retrieval_query(
            ticket.subject,
            ticket.description,
        )

        rag_results = await self.rag.retrieve(
            db,
            organization_id=ticket.organization_id,
            query=rag_query,
            limit=5,
            min_similarity=0.55
        )

        rag_context = build_rag_context(
            rag_results
        )

        existing_analysis = await db.scalar(
            select(TicketAIAnalysis).where(
            TicketAIAnalysis.job_id == job.id
            )
        )

        if existing_analysis:
            return existing_analysis

        result = await self.provider.analyze_ticket(
            subject=ticket.subject,
            description=ticket.description,
            rag_context=rag_context
        )

        analysis = TicketAIAnalysis(
            ticket_id=ticket.id,
            job_id=job.id,
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

    def build_ticket_retrieval_query(
        subject: str,
        description: str,
    ) -> str:
        return (
            f"Customer support issue\n\n"
            f"Subject: {subject}\n\n"
            f"Description: {description}"
        )


    
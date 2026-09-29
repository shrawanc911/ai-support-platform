from typing import Protocol

from app.ai.schemas import TicketAIAnalysisResult


class AIProvider(Protocol):

    async def analyze_ticket(
        self,
        subject: str,
        description: str,
        rag_context:str,
        job
    ) -> TicketAIAnalysisResult:
        ...
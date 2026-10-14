import asyncio
import json

from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select 
from app.core.database import AsyncSessionLocal
from app.core.redis import redis_client

from app.ai.providers.openrouter_provider import OpenRouterProvider
from app.ai.service import TicketAIService
from app.models.ticket import Ticket, TicketPriority
from app.models.ticket_ai_analysis import TicketAIAnalysis
from app.core.config import settings

async def process_job(payload:dict) -> None:
    job_id = payload["job_id"]
    ticket_id = UUID(str(payload["ticket_id"]))
    print(f"{job_id} with ticket id {ticket_id} started work")
    async with AsyncSessionLocal() as db:
        try:
            ticket = await db.scalar(
                select(Ticket).where(
                    Ticket.id == ticket_id
                )
            )

            if ticket is None:
                raise ValueError(
                    "Ticket not found"
                )

            provider = OpenRouterProvider()
            ai_service = TicketAIService(provider=provider)
            result = await ai_service.provider.analyze_ticket(ticket.subject,ticket.description,"")

            priority = TicketPriority(result.priority)
            analysis = TicketAIAnalysis(
                job_id=job_id,
                ticket_id=ticket.id,
                category=result.category,
                priority=priority.value,
                sentiment=result.sentiment,
                summary=result.summary,
                suggested_response=result.suggested_response,
                confidence=result.confidence,
                model=settings.OPENROUTER_MODEL,
                prompt_version="v1",
            )

            ticket.priority = priority

            db.add(analysis)
            db.add(ticket)
            await db.commit()
            await db.refresh(analysis)
            await db.refresh(ticket)
            
        except:
            await db.rollback()
        print(f"{job_id} with ticket id {ticket_id} completed work")


            

async def worker_loop():
    print("Ticket Analysis Worker started")

    while True:
        result = await redis_client.blpop(
            "TICKET_ANALYSIS_QUEUE",
            timeout=5
        )

        if not result:
            continue

        _, raw_payload = result

        payload = json.loads(raw_payload)
        await process_job(payload)

if __name__ == "__main__":
    asyncio.run(worker_loop())
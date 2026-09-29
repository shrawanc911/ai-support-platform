import asyncio
import json
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from app.ai.providers.openrouter_provider import (OpenRouterProvider)
from app.ai.service import TicketAIService
from app.core.redis import redis_client
from app.core.database import AsyncSessionLocal
from app.models.ai_job import (
    AIJob,
    AIJobStatus,
)
from app.models.ticket import Ticket
from app.ai.queue import AI_QUEUE_NAME
from app.ai.events import publish_ai_job_event

async def process_job(payload: dict):
    job_id = UUID(payload["job_id"])
    ticket_id = UUID(payload["ticket_id"])

    async with AsyncSessionLocal() as db:

        # -----------------------------
        # 1. Get job
        # -----------------------------

        job = await db.scalar(
            select(AIJob).
            where(
                AIJob.id == job_id
            )
        )

        if not job:
            return

        # ----------------------------- 
        # 2. Mark PROCESSING
        # -----------------------------

        job.status = AIJobStatus.PROCESSING
        job.started_at = datetime.now(
            timezone.utc
        )
        job.progress_message = "AI worker started"

        await db.commit()

        await publish_ai_job_event(
            job.id,
            "progress",
            {
                "status": "PROCESSING",
                "message": "AI worker started",
            },
        )

        try:

            # -----------------------------
            # 3. Get ticket
            # -----------------------------

            ticket = await db.scalar(
                select(Ticket).
                where(
                    Ticket.id == ticket_id
                )
            )

            if not ticket:
                raise ValueError(
                    "Ticket not found"
                )

            # -----------------------------
            # 4. Update progress
            # -----------------------------

            job.progress_message = "Analyzing ticket with AI"

            await db.commit()

            await publish_ai_job_event(
                job.id,
                "progress",
                {
                    "status": "PROCESSING",
                    "message": "Analyzing ticket with AI",
                },
            )

            # -----------------------------
            # 5. Call AI service
            # -----------------------------

            service = TicketAIService(
                OpenRouterProvider()
            )

            await service.analyze_ticket(
                db,
                ticket
            )

            # -----------------------------
            # 6. Completed
            # -----------------------------

            job.status = (
                AIJobStatus.COMPLETED
            )
            job.completed_at = datetime.now(
                timezone.utc
            )
            job.progress_message = "AI analysis completed"

            await db.commit()
            await publish_ai_job_event(
                job.id,
                "completed",
                {
                    "status": "COMPLETED",
                    "message": "AI analysis completed",
                },
            )

        except Exception as exc:

            # -----------------------------
            # 7. Failed
            # -----------------------------
            
            job.status = AIJobStatus.FAILED
            job.error_message = str(exc)
            job.progress_message = "AI analysis failed"

            await db.commit()

            await publish_ai_job_event(
                job.id,
                "failed",
                {
                    "status": "FAILED",
                    "message": "AI analysis failed",
                    "error": str(exc),
                },
            )

async def worker_loop():

    print("AI worker started")

    while True:

        result = await redis_client.blpop(
            AI_QUEUE_NAME,
            timeout=5,
        )

        if not result:
            continue

        _, raw_payload = result

        payload = json.loads(raw_payload)

        await process_job(payload)

if __name__ == "__main__":
    asyncio.run(worker_loop())
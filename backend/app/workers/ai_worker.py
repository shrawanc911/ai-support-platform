import asyncio
import json
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from app.core.config import settings
from app.core.redis import redis_client
from app.core.database import AsyncSessionLocal
from app.models.ai_job import (
    AIJob,
    AIJobStatus,
)
from app.models.ticket import Ticket
from app.ai.providers.openrouter_provider import (OpenRouterProvider)
from app.ai.service import TicketAIService
from app.ai.queue import AI_QUEUE_NAME
from app.ai.events import publish_ai_job_event
from app.ai.jobs import (
    mark_job_completed,
    mark_job_failed,
    mark_job_processing,
    recover_stale_jobs,
)



async def process_job(payload: dict) -> None:

    job_id = payload["job_id"]
    ticket_id = payload["ticket_id"]

    async with AsyncSessionLocal() as db:

        job = await db.scalar(
            select(AIJob).where(
                AIJob.id == job_id
            )
        )

        if job is None:
            print(
                f"AI job {job_id} not found"
            )
            return

        # --------------------------------
        # IDEMPOTENCY CHECK
        # --------------------------------

        if job.status == AIJobStatus.COMPLETED:
            print(
                f"AI job {job_id} already completed"
            )
            return

        # --------------------------------
        # ATTEMPT LIMIT
        # --------------------------------

        if job.attempts >= settings.AI_MAX_ATTEMPTS:
            await mark_job_failed(
                db,
                job,
                "Maximum AI analysis attempts exceeded",
            )
            return

        # --------------------------------
        # PROCESSING
        # --------------------------------

        await mark_job_processing(
            db,
            job,
        )

        try:

            # --------------------------------
            # GET TICKET
            # --------------------------------

            ticket = await db.scalar(
                select(Ticket).where(
                    Ticket.id == ticket_id
                )
            )

            if ticket is None:
                raise ValueError(
                    "Ticket not found"
                )

            # --------------------------------
            # AI ANALYSIS
            # --------------------------------

            provider = OpenRouterProvider()

            ai_service = TicketAIService(
                provider=provider
            )

            await ai_service.analyze_ticket(
                db=db,
                ticket=ticket,
                job=job
            )

            # --------------------------------
            # SUCCESS
            # --------------------------------

            await mark_job_completed(
                db,
                job,
            )

        except Exception as exc:

            print(
                f"AI job {job_id} failed: {exc}"
            )

            # --------------------------------
            # RETRY
            # --------------------------------

            if job.attempts < settings.AI_MAX_ATTEMPTS:
                retry_delay = 2 ** job.attempts
                
                job.status = AIJobStatus.QUEUED
                job.progress_message = (
                    f"Retrying AI analysis in "
                    f"{retry_delay} seconds..."
                )

                job.error_message = str(exc)

                await db.commit()

                await publish_ai_job_event(
                    job.id,
                    "progress",
                    {
                        "status": "QUEUED",
                        "attempts": job.attempts,
                        "message": (
                            f"Retrying AI analysis in "
                            f"{retry_delay} seconds..."
                        ),
                    },
                )

                await asyncio.sleep(
                    retry_delay
                )

                await redis_client.rpush(
                    AI_QUEUE_NAME,
                    json.dumps({
                        "job_id": str(job.id),
                        "ticket_id": str(ticket.id),
                    }),
                )
            else:

                await mark_job_failed(
                    db,
                    job,
                    str(exc),
                )
                
async def worker_loop():

    print("AI worker started")

    while True:

        async with AsyncSessionLocal() as db:
            await recover_stale_jobs(db)

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
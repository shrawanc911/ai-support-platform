from datetime import datetime, timezone, timedelta
from uuid import UUID
import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_job import AIJobStatus
from app.ai.events import publish_ai_job_event
from app.ai.queue import AI_QUEUE_NAME

from app.core.config import settings
from app.core.redis import redis_client

from app.models.ai_job import AIJob


async def mark_job_processing(
    db: AsyncSession,
    job: AIJob,
) -> None:

    job.status = AIJobStatus.PROCESSING

    job.attempts += 1

    job.started_at = datetime.now(timezone.utc)

    job.progress_message = (
        f"AI analysis attempt {job.attempts}"
    )

    job.error_message = None

    await db.commit()

    await publish_ai_job_event(
        job.id,
        "progress",
        {
            "status": "PROCESSING",
            "attempts": job.attempts,
            "message": (
                f"AI analysis attempt "
                f"{job.attempts} started"
            ),
        },
    )


async def mark_job_completed(
    db: AsyncSession,
    job: AIJob,
) -> None:

    job.status = AIJobStatus.COMPLETED

    job.progress_message = (
        "AI analysis completed"
    )

    job.completed_at = datetime.now(timezone.utc)

    await db.commit()

    await publish_ai_job_event(
        job.id,
        "completed",
        {
            "status": "COMPLETED",
            "attempts": job.attempts,
            "message": (
                "AI analysis completed"
            ),
        },
    )


async def mark_job_failed(
    db: AsyncSession,
    job: AIJob,
    error_message: str,
) -> None:

    job.status = AIJobStatus.FAILED

    job.progress_message = (
        "AI analysis failed"
    )

    job.error_message = error_message

    await db.commit()

    await publish_ai_job_event(
        job.id,
        "failed",
        {
            "status": "FAILED",
            "attempts": job.attempts,
            "message": (
                "AI analysis failed"
            ),
        },
    )

async def recover_stale_jobs(
    db: AsyncSession,
) -> int:

    cutoff = (
        datetime.now(timezone.utc)
        - timedelta(
            minutes=settings.AI_JOB_TIMEOUT_MINUTES
        )
    )

    result = await db.scalars(
        select(AIJob).where(
            AIJob.status == AIJobStatus.PROCESSING,
            AIJob.started_at < cutoff,
        )
    )

    jobs = result.all()

    recovered = 0

    for job in jobs:

        if job.attempts >= settings.AI_MAX_ATTEMPTS:

            job.status = AIJobStatus.FAILED

            job.progress_message = (
                "AI job timed out"
            )

            job.error_message = (
                "Maximum attempts exceeded"
            )

        else:

            job.status = AIJobStatus.QUEUED

            job.progress_message = (
                "Recovering stale AI job..."
            )

            await redis_client.rpush(
                AI_QUEUE_NAME,
                json.dumps({
                    "job_id": str(job.id),
                    "ticket_id": str(
                        job.ticket_id
                    ),
                }),
            )

        recovered += 1

    await db.commit()

    return recovered

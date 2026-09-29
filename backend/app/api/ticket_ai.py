import json
import asyncio
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.providers.openrouter_provider import OpenRouterProvider
from app.core.authorization import ensure_ticket_access
from app.core.dependencies import get_current_user
from app.services.ai_job_service import AIJobService
from app.services.ticket_service import TicketService
from app.core.dependencies import get_db
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.ai_job import AIJobResponse
from app.models.ai_job import AIJob
from app.core.redis import redis_client
from app.ai.events import get_ai_job_channel
from app.schemas.ai_job import AIJobStatus


router = APIRouter(
    prefix="/tickets",
    tags=["Ticket AI"],
)

ticket_service = TicketService()

@router.post(
    "/{ticket_id}/ai/analyze",
    response_model=AIJobResponse,
    status_code=202
)
async def analyze_ticket(
    ticket_id: UUID,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    db: AsyncSession = Depends(get_db),
):
    ticket = await db.scalar(
        select(Ticket).where(
            Ticket.id == ticket_id,
            Ticket.organization_id
            == current_user.organization_id,
        )
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    ensure_ticket_access(
        current_user,
        ticket,
    )

    service = AIJobService()

    return await service.create_ticket_analysis_job(
        db,
        ticket.id,
    )

@router.get("{ticket_id}/ai/jobs/{job_id}",response_model=AIJobResponse)
async def get_ai_job(
    ticket_id:UUID,
    job_id:UUID,
    current_user:Annotated[
        User,
        Depends(get_current_user)
    ],
    db: AsyncSession = Depends(get_db)
):
    ticket = await db.scalar(
        select(Ticket).where(
            Ticket.id == ticket_id,
            Ticket.organization_id == current_user.organization_id,
        )
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    ensure_ticket_access(
        current_user,
        ticket,
    )

    job = await db.scalar(
        select(AIJob).where(
            AIJob.id == job_id,
            AIJob.ticket_id == ticket_id,
        )
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="AI job not found",
        )

    return job

@router.get(
    "/tickets/{ticket_id}/ai/jobs/{job_id}/stream"
)
async def stream_ai_job(
    ticket_id: UUID,
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = await ticket_service.get_by_id(
        db,
        ticket_id,
        current_user,
    )

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )
    job = await db.scalar(
        select(AIJob).where(
            AIJob.id == job_id,
            AIJob.ticket_id == ticket_id,
        )
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="AI job not found",
        )

    async def event_generator():
        pubsub = redis_client.pubsub()

        channel = get_ai_job_channel(job_id)

        if job.status == AIJobStatus.COMPLETED:
            yield (
                "event: completed\n"
                f"data: {json.dumps({
                    'status': 'COMPLETED',
                    'message': 'AI analysis completed',
                })}\n\n"
            )
            return

        if job.status == AIJobStatus.FAILED:
            yield (
                "event: failed\n"
                f"data: {json.dumps({
                    'status': 'FAILED',
                    'message': 'AI analysis failed',
                })}\n\n"
            )
            return

        await pubsub.subscribe(channel)

        try:
            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0,
                )

                if message:
                    data = json.loads(message["data"])

                    yield (
                        f"event: {data['event']}\n"
                        f"data: {json.dumps(data)}\n\n"
                    )

                    if data["event"] in {
                        "completed",
                        "failed",
                    }:
                        break

                await asyncio.sleep(0.1)

        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.aclose()

    return StreamingResponse(
    event_generator(),
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    },
)
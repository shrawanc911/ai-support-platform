from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.queue import (enqueue_ticket_analysis)
from app.models.ai_job import (AIJob,AIJobStatus)

class AIJobService:
    async def create_ticket_analysis_job(
            self,
            db:AsyncSession,
            ticket_id:UUID
    ) -> AIJob:
        job = AIJob(ticket_id=ticket_id,status=AIJobStatus)
        db.add(job)
        await db.commit()
        await db.refresh(job)

        await enqueue_ticket_analysis(job.id,ticket_id)

        return job
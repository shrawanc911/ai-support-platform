from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.ai_job import AIJobStatus

class AIJobResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    ticket_id: UUID
    status: AIJobStatus
    progress_message: str | None
    error_message:str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
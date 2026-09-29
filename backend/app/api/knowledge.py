from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.knowledge.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentResponse,
    KnowledgeSearchResult,
)
from app.knowledge.service import KnowledgeService
from app.models.user import User

router = APIRouter(
    prefix="/knowledge",
    tags=["Knowledge Base"],
)

service = KnowledgeService()

@router.post(
    "/documents",
    response_model=KnowledgeDocumentResponse,
)
async def create_document(
    data: KnowledgeDocumentCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(get_db),
):

    return await service.create_document(
        db=db,
        organization_id=current_user.organization_id,
        title=data.title,
        content=data.content,
        source=data.source,
    )

@router.get(
    "/search",
    response_model=list[KnowledgeSearchResult],
)
async def search_knowledge(
    q: str = Query(
        min_length=2,
        max_length=500,
    ),
    limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(get_db),
):

    return await service.search(
        db=db,
        organization_id=current_user.organization_id,
        query=q,
        limit=limit,
    )
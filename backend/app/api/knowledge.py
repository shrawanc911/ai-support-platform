from uuid import UUID
from typing import Annotated
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user,Depends,require_roles
from app.knowledge.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentResponse,
    KnowledgeDocumentDetailResponse,
    KnowledgeSearchResult,
)
from app.knowledge.service import KnowledgeService
from app.models.user import User, UserRole

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

@router.get(
    "/documents",
    response_model=list[KnowledgeDocumentResponse],
)
async def list_documents(
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.AGENT,
                UserRole.MANAGER,
                UserRole.ADMIN,
            )
        ),
    ],
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService()

    return await service.list_documents(
        db=db,
        organization_id=current_user.organization_id,
    )

@router.get(
    "/documents/{document_id}",
    response_model=KnowledgeDocumentDetailResponse,
)
async def get_document(
    document_id: UUID,
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.AGENT,
                UserRole.MANAGER,
                UserRole.ADMIN,
            )
        ),
    ],
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService()

    document = await service.get_document(
        db=db,
        organization_id=current_user.organization_id,
        document_id=document_id,
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )

    return document


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_document(
    document_id: UUID,
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.MANAGER,
                UserRole.ADMIN,
            )
        ),
    ],
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService()

    deleted = await service.delete_document(
        db=db,
        organization_id=current_user.organization_id,
        document_id=document_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )


@router.post(
    "/documents/{document_id}/reindex",
    response_model=KnowledgeDocumentResponse,
)
async def reindex_document(
    document_id: UUID,
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.MANAGER,
                UserRole.ADMIN,
            )
        ),
    ],
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService()

    document = await service.reindex_document(
        db=db,
        organization_id=current_user.organization_id,
        document_id=document_id,
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )

    return document


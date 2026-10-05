from uuid import UUID
from typing import Annotated
from fastapi import APIRouter, Depends, Query, HTTPException, status, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
from uuid import uuid4

from app.core.dependencies import (
    get_current_user,
    Depends,
    require_roles,
    get_db
)
from app.knowledge.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentResponse,
    KnowledgeDocumentDetailResponse,
    KnowledgeSearchResult,
)
from app.core.config import settings

from app.knowledge.service import KnowledgeService
from app.knowledge.queue import enqueue_document_ingestion
from app.models.user import User, UserRole
from app.models.knowledge_document import KnowledgeDocument, KnowledgeDocumentStatus

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

@router.post(
    "/documents/upload",
    response_model=KnowledgeDocumentResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.MANAGER,
                UserRole.ADMIN,
            )
        ),
    ] = None,
    db: AsyncSession = Depends(get_db),
):
    extension = Path(
        file.filename or ""
    ).suffix.lower()

    allowed_extensions = {
        ".txt",
        ".md",
        ".markdown",
        ".pdf",
        ".docx",
    }

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Supported files: "
                ".txt, .md, .markdown, .pdf, .docx"
            ),
        )

    storage_dir = Path(settings.STORAGE_DIR)
    storage_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    stored_name = (
        f"{uuid4()}{extension}"
    )

    file_path = storage_dir / stored_name

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    file_path.write_bytes(contents)

    document = KnowledgeDocument(
        organization_id=current_user.organization_id,
        title=title,
        content="",
        source=file.filename,
        file_name=file.filename,
        file_type=extension,
        file_size=len(contents),
        status=KnowledgeDocumentStatus.PENDING,
        storage_path=str(
            file_path
        ),
    )

    db.add(document)

    await db.commit()
    await db.refresh(document)
    print("ENQUEUE")
    await enqueue_document_ingestion(
        document.id
    )

    return document

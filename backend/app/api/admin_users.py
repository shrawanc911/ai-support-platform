from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
)
from app.services.admin_user_service import AdminUserService
from app.database import get_db


router = APIRouter(
    prefix="/admin/users",
    tags=["Admin Users"],
)

service = AdminUserService()

AdminUser = Annotated[
    User,
    Depends(require_roles(UserRole.ADMIN)),
]

@router.post(
    "",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    data: AdminUserCreate,
    current_user: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.create_user(
            db,
            current_user.organization_id,
            data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
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
from app.core.dependencies import get_db


router = APIRouter(
    prefix="/admin",
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

@router.get(
    "/organizations/{organizationId}/users",
    response_model=list[AdminUserResponse],
    status_code=status.HTTP_200_OK,
)
async def get_users_list(
    organizationId:UUID,
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.ADMIN)),
    ],
    db: AsyncSession = Depends(get_db),
) -> list[AdminUserResponse]:
    try:
        result = await service.list_users(organizationId,db)
        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

@router.patch("/organization/{organizationId}/user/{userId}/update_user")
async def update_user(organizationId:UUID,userId:UUID,data:AdminUserUpdate,current_user:Annotated[User,Depends(require_roles(UserRole.ADMIN,UserRole.MANAGER))], db:AsyncSession = Depends(get_db)):
    try:
        user = await service.update_user(
            db,
            organization_id=organizationId,
            user_id=userId,
            current_user=current_user,
            data=data,
        )
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found in this organization",
            )
        return user
    except HTTPException:
        raise
    except Exception as exc:
        # Log the exception in production.
        raise HTTPException(
            status_code=500,
            detail="Failed to update user",
        ) from exc


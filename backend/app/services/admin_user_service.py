from uuid import UUID
from typing import Annotated
from fastapi import HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import require_roles

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminUserCreate,
    AdminUserUpdate,
    AdminUserResponse
)


class AdminUserService:

    async def list_users(
        self,
        organizationId: UUID,
        db: AsyncSession,
    ) -> list[User]:

        result = await db.scalars(
            select(User)
            .where(User.organization_id==organizationId)
            .order_by(User.created_at.desc())
        )

        return list(result.all())

    async def create_user(
        self,
        db: AsyncSession,
        organization_id: UUID,
        data: AdminUserCreate,
    ) -> User:

        existing = await db.scalar(
            select(User).where(
                User.email == data.email
            )
        )

        if existing:
            raise ValueError(
                "A user with this email already exists"
            )

        user = User(
            organization_id=organization_id,
            name=data.name,
            email=data.email,
            hashed_password=hash_password(data.password),
            role=data.role,
            is_active=True,
        )

        db.add(user)

        await db.commit()
        await db.refresh(user)

        return user

    async def update_user(
        self,
        db: AsyncSession,
        organization_id:UUID,
        user_id: UUID,
        current_user:User,
        data: AdminUserUpdate,
    ) -> User | None:
    
        if user_id == current_user.id:
            if data.role is not None:
                raise HTTPException(
                    status_code=400,
                    detail="You cannot change your own role",
                )

            if data.is_active is False:
                raise HTTPException(
                    status_code=400,
                    detail="You cannot deactivate yourself",
                )


        user = await db.scalar(
            select(User).where(
                User.id == user_id,
                User.organization_id == organization_id,
            )
        )

        if not user:
            return None

        if data.role is not None:
            user.role = data.role

        if data.is_active is not None:
            user.is_active = data.is_active

        await db.commit()
        await db.refresh(user)

        return user

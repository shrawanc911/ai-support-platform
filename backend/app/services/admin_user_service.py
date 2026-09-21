from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminUserCreate,
    AdminUserUpdate,
)


class AdminUserService:

    async def list_users(
        self,
        db: AsyncSession,
        organization_id: UUID,
    ) -> list[User]:

        result = await db.scalars(
            select(User)
            .where(
                User.organization_id == organization_id
            )
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
        current_user:User,
        user_id: UUID,
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
                User.organization_id == current_user.organization_id,
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
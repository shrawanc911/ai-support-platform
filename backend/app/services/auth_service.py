from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
)


class AuthService:

    @staticmethod
    async def register(
        db: AsyncSession,
        data: RegisterRequest,
    ) -> User:
        
        organization_result = await db.execute(
            select(Organization).where(
                Organization.id
                == data.organization_id
            )
        )

        organization = (
            organization_result.scalar_one_or_none()
        )

        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organization not found",
            )

        existing_result = await db.execute(
            select(User).where(
                User.email == data.email
            )
        )

        existing_user = (
            existing_result.scalar_one_or_none()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email already registered",
            )

        user = User(
            organization_id=data.organization_id,
            name=data.name,
            email=data.email,
            hashed_password=hash_password(
                data.password
            ),
            role=data.role,
            is_active=True
        )

        db.add(user)

        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def login(
        db: AsyncSession,
        data: LoginRequest,
    ) -> str:

        result = await db.execute(
            select(User).where(
                User.email == data.email
            )
        )

        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(
            data.password,
            user.hashed_password,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        return create_access_token(
            str(user.id)
        )
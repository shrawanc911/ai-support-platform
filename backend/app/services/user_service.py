from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate

class UserService:

    async def create(self,db:AsyncSession,data:UserCreate) -> User:
        organization_exists = await db.scalar(
            select(User.id).
            where(User.organization_id == data.organization_id).
            limit(1)
        )
        existing_user = await db.scalar(
            select(User).
            where(User.email == data.email)
        )
        if existing_user:
            raise ValueError("User email already exists")

        user = User(
            organization_id=data.organization_id,
            email=data.email,
            name=data.name,
            role=data.role
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        return user

    async def get_by_id(self,db:AsyncSession,user_id:UUID) -> User | None:
        return await db.scalar(
            select(User).
            where(User.id == user_id)
        )

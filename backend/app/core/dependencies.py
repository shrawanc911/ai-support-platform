from typing import Annotated
import jwt
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from collections.abc import AsyncGenerator, Callable

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

async def get_db() -> AsyncGenerator[AsyncSession,None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
        token: Annotated[
            str,
            Depends(oauth2_scheme)
        ],
        db:AsyncSession = Depends(get_db)
) -> User:
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[
                settings.JWT_ALGORITHM
            ]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credential_exception

        user_uuid = UUID(user_id)

    except (InvalidTokenError,ValueError):
        raise credential_exception

    result = await db.execute(
        select(User).where(
            User.id == user_uuid
        )
    )

    user = result.scalar_one_or_none()
    if user is None:
        raise credential_exception
    return user

def require_roles(*allowed_roles:UserRole)->Callable:
    async def role_checker(
            current_user:Annotated[
                User,
                Depends(get_current_user)
            ]
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user
    return role_checker
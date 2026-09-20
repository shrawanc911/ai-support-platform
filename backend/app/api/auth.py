from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.core.dependencies import get_db, get_current_user
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService
from app.models.user import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=CurrentUserResponse,
    status_code=201,
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.register(
        db,
        data,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    token = await AuthService.login(
        db,
        data,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.get("/me",response_model=CurrentUserResponse)
async def get_me(current_user:Annotated[User,Depends(get_current_user)]):
    return current_user
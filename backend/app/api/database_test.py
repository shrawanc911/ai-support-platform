from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db


router = APIRouter(
    prefix="/database",
    tags=["Database"],
)


@router.get("/health")
async def database_health(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("SELECT 1"))

    return {
        "database": "ok",
        "result": result.scalar(),
    }
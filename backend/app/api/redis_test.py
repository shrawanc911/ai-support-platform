from fastapi import APIRouter

from app.core.redis import redis_client


router = APIRouter(
    prefix="/redis",
    tags=["Redis"],
)


@router.get("/health")
async def redis_health():

    await redis_client.set(
        "health_check",
        "ok",
        ex=30,
    )

    value = await redis_client.get(
        "health_check"
    )

    return {
        "redis": value
    }
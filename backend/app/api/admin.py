from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.dependencies import require_roles
from app.models.user import User, UserRole


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/dashboard")
async def admin_dashboard(
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
            )
        ),
    ],
):
    return {
        "message": "Welcome to admin dashboard",
        "user_id": str(current_user.id),
        "organization_id": str(
            current_user.organization_id
        ),
    }
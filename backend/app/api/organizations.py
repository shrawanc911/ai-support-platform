from uuid import UUID

from fastapi import APIRouter,Depends, HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.organization import ( OrganizationCreate , OrganizationResponse)
from app.services.organization_service import OrganizationService

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"]
)

service = OrganizationService()

@router.post(
    "",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_organization(data: OrganizationCreate,db: AsyncSession = Depends(get_db)):
    try:
        return await service.create(db,data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail=str(exc))

@router.get("/{organization_id}",response_model=OrganizationResponse)
async def get_organization(organization_id:UUID,db:AsyncSession=Depends(get_db)):
    organization =  await service.get_by_id(db,organization_id)
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    return organization

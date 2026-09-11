from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate

class OrganizationService:
    async def create(self,db:AsyncSession,data:OrganizationCreate) -> Organization:
        existing = await db.scalar(select(Organization).where(Organization.slug == data.slug))

        if existing:
            raise ValueError("Organization slug already exists")

        organization = Organization(name=data.name,slug=data.slug)
        db.add(organization)
        await db.commit()
        await db.refresh(organization)

        return organization

    async def get_by_id(self,db:AsyncSession,organization_id:UUID) -> Organization | None:
        return await db.scalar(select(Organization).where(Organization.id == organization_id))

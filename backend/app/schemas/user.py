from datetime import datetime
from uuid import UUID

from pydantic import BaseModel , ConfigDict, EmailStr

from app.models.user import UserRole

class UserCreate(BaseModel):
    organization_id: UUID
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.CUSTOMER

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:UUID
    organization_id:UUID
    email:EmailStr
    name: str
    role:UserRole
    created_at:datetime
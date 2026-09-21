from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole

class RegisterRequest(BaseModel):
    organization_id: UUID
    name: str = Field(
        min_length=2,
        max_length=100
    )
    email: EmailStr
    password:str = Field(
        min_length=8,
        max_length=128
    )
    role:UserRole = UserRole.CUSTOMER

class LoginRequest(BaseModel):
    email:EmailStr
    password:str

class TokenResponse(BaseModel):
    access_token:str
    token_type:str

class CurrentUserResponse(BaseModel):
    id:UUID
    organization_id:UUID
    name:str
    email :EmailStr
    role:UserRole
    is_active:bool
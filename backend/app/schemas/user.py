from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    company_id: int | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = None
    is_active: bool | None = None
    is_superuser: bool | None = None
    password: str | None = None
    company_id: int | None = None


class RoleRead(BaseModel):
    id: int
    name: str
    description: str

    model_config = {"from_attributes": True}


class CompanyRead(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class UserRead(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    is_superuser: bool
    company_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserWithRoles(UserRead):
    roles: list[RoleRead] = []
    company: CompanyRead | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: str | None = None

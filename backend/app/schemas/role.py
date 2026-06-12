
from pydantic import BaseModel


class PermissionRead(BaseModel):
    id: int
    codename: str
    description: str

    model_config = {"from_attributes": True}


class RoleCreate(BaseModel):
    name: str
    description: str = ""


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class RoleRead(BaseModel):
    id: int
    name: str
    description: str

    model_config = {"from_attributes": True}


class RoleWithPermissions(RoleRead):
    permissions: list[PermissionRead] = []


class RolePermissionsUpdate(BaseModel):
    permission_ids: list[int]

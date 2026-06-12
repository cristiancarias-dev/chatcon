from fastapi import APIRouter, Depends, status

from app.auth import require_permission
from app.dependencies import get_role_service
from app.models.user import User
from app.schemas.role import (
    RoleCreate,
    RolePermissionsUpdate,
    RoleRead,
    RoleUpdate,
    RoleWithPermissions,
)
from app.services.role_service import RoleService

router = APIRouter()


@router.get("/", response_model=list[RoleWithPermissions])
def list_roles(
    service: RoleService = Depends(get_role_service),
    _: User = Depends(require_permission("read_role")),
):
    return service.get_all()


@router.post("/", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    role_data: RoleCreate,
    service: RoleService = Depends(get_role_service),
    _: User = Depends(require_permission("create_role")),
):
    return service.create(role_data)


@router.get("/{role_id}", response_model=RoleWithPermissions)
def read_role(
    role_id: int,
    service: RoleService = Depends(get_role_service),
    _: User = Depends(require_permission("read_role")),
):
    return service.get_by_id(role_id)


@router.put("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    service: RoleService = Depends(get_role_service),
    _: User = Depends(require_permission("update_role")),
):
    return service.update(role_id, role_data)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    service: RoleService = Depends(get_role_service),
    _: User = Depends(require_permission("delete_role")),
):
    service.delete(role_id)


@router.get("/{role_id}/permissions", response_model=RoleWithPermissions)
def read_role_permissions(
    role_id: int,
    service: RoleService = Depends(get_role_service),
    _: User = Depends(require_permission("read_role")),
):
    return service.get_by_id(role_id)


@router.put("/{role_id}/permissions", response_model=RoleWithPermissions)
def update_role_permissions(
    role_id: int,
    data: RolePermissionsUpdate,
    service: RoleService = Depends(get_role_service),
    _: User = Depends(require_permission("update_role")),
):
    return service.update_permissions(role_id, data.permission_ids)

from fastapi import APIRouter, Depends, status

from app.auth import get_current_user, require_permission
from app.dependencies import get_permission_repo, get_role_repo
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
    repo=Depends(get_role_repo),
    _: User = Depends(require_permission("read_role")),
):
    service = RoleService(repo)
    return service.get_all()


@router.post("/", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    role_data: RoleCreate,
    repo=Depends(get_role_repo),
    _: User = Depends(require_permission("create_role")),
):
    service = RoleService(repo)
    return service.create(role_data)


@router.get("/{role_id}", response_model=RoleWithPermissions)
def read_role(
    role_id: int,
    repo=Depends(get_role_repo),
    _: User = Depends(require_permission("read_role")),
):
    service = RoleService(repo)
    return service.get_by_id(role_id)


@router.put("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    repo=Depends(get_role_repo),
    _: User = Depends(require_permission("update_role")),
):
    service = RoleService(repo)
    return service.update(role_id, role_data)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    repo=Depends(get_role_repo),
    _: User = Depends(require_permission("delete_role")),
):
    service = RoleService(repo)
    service.delete(role_id)


@router.get("/{role_id}/permissions", response_model=RoleWithPermissions)
def read_role_permissions(
    role_id: int,
    repo=Depends(get_role_repo),
    _: User = Depends(require_permission("read_role")),
):
    service = RoleService(repo)
    return service.get_by_id(role_id)


@router.put("/{role_id}/permissions", response_model=RoleWithPermissions)
def update_role_permissions(
    role_id: int,
    data: RolePermissionsUpdate,
    role_repo=Depends(get_role_repo),
    perm_repo=Depends(get_permission_repo),
    _: User = Depends(require_permission("update_role")),
):
    service = RoleService(role_repo, perm_repo)
    return service.update_permissions(role_id, data.permission_ids)

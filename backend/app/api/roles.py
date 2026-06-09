from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models.role import Permission, Role
from app.models.user import User
from app.schemas.role import (
    RoleCreate,
    RoleRead,
    RoleUpdate,
    RoleWithPermissions,
    RolePermissionsUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[RoleWithPermissions])
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("read_role")),
):
    return db.query(Role).all()


@router.post("/", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("create_role")),
):
    existing = db.query(Role).filter(Role.name == role_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role already exists",
        )
    role = Role(name=role_data.name, description=role_data.description)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get("/{role_id}", response_model=RoleWithPermissions)
def read_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("read_role")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return role


@router.put("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("update_role")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    if role_data.name is not None:
        existing = db.query(Role).filter(Role.name == role_data.name).first()
        if existing and existing.id != role.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Role name already exists",
            )
        role.name = role_data.name
    if role_data.description is not None:
        role.description = role_data.description
    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("delete_role")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    db.delete(role)
    db.commit()


@router.get("/{role_id}/permissions", response_model=RoleWithPermissions)
def read_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("read_role")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return role


@router.put("/{role_id}/permissions", response_model=RoleWithPermissions)
def update_role_permissions(
    role_id: int,
    data: RolePermissionsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("update_role")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    permissions = db.query(Permission).filter(Permission.id.in_(data.permission_ids)).all()
    if len(permissions) != len(data.permission_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more permissions not found",
        )
    role.permissions = permissions
    db.commit()
    db.refresh(role)
    return role

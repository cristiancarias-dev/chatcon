from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository, PermissionRepository


def get_user_repo(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_role_repo(db: Session = Depends(get_db)) -> RoleRepository:
    return RoleRepository(db)


def get_permission_repo(db: Session = Depends(get_db)) -> PermissionRepository:
    return PermissionRepository(db)

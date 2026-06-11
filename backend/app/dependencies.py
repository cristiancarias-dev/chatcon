from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.contact_repository import ContactRepository
from app.repositories.conversation_repository import (
    ConversationRepository,
    MessageRepository,
)
from app.repositories.role_repository import PermissionRepository, RoleRepository
from app.repositories.user_repository import UserRepository


def get_user_repo(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_role_repo(db: Session = Depends(get_db)) -> RoleRepository:
    return RoleRepository(db)


def get_permission_repo(db: Session = Depends(get_db)) -> PermissionRepository:
    return PermissionRepository(db)


def get_contact_repo(db: Session = Depends(get_db)) -> ContactRepository:
    return ContactRepository(db)


def get_conv_repo(db: Session = Depends(get_db)) -> ConversationRepository:
    return ConversationRepository(db)


def get_msg_repo(db: Session = Depends(get_db)) -> MessageRepository:
    return MessageRepository(db)

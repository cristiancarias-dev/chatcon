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
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.repositories.whatsapp_template_repository import WhatsAppTemplateRepository
from app.services.auth_service import AuthService
from app.services.contact_service import ContactService
from app.services.conversation_service import ConversationService
from app.services.role_service import RoleService
from app.services.user_service import UserService
from app.services.whatsapp_account_service import WhatsAppAccountService
from app.services.whatsapp_template_service import WhatsAppTemplateService
from app.uow import UnitOfWork

# ── Unit of Work ──────────────────────────────────────────────────────────────

def get_uow(db: Session = Depends(get_db)) -> UnitOfWork:
    return UnitOfWork(db)


# ── Repositories ──────────────────────────────────────────────────────────────

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


def get_wa_account_repo(db: Session = Depends(get_db)) -> WhatsAppAccountRepository:
    return WhatsAppAccountRepository(db)


def get_wa_template_repo(db: Session = Depends(get_db)) -> WhatsAppTemplateRepository:
    return WhatsAppTemplateRepository(db)


# ── Services ──────────────────────────────────────────────────────────────────

def get_auth_service(repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(repo)


def get_user_service(
    user_repo: UserRepository = Depends(get_user_repo),
    role_repo: RoleRepository = Depends(get_role_repo),
) -> UserService:
    return UserService(user_repo, role_repo)


def get_role_service(
    role_repo: RoleRepository = Depends(get_role_repo),
    perm_repo: PermissionRepository = Depends(get_permission_repo),
) -> RoleService:
    return RoleService(role_repo, perm_repo)


def get_contact_service(
    contact_repo: ContactRepository = Depends(get_contact_repo),
    user_repo: UserRepository = Depends(get_user_repo),
    role_repo: RoleRepository = Depends(get_role_repo),
) -> ContactService:
    return ContactService(contact_repo, user_repo, role_repo)


def get_conversation_service(
    conv_repo: ConversationRepository = Depends(get_conv_repo),
    msg_repo: MessageRepository = Depends(get_msg_repo),
    wa_account_repo: WhatsAppAccountRepository = Depends(get_wa_account_repo),
) -> ConversationService:
    return ConversationService(conv_repo, msg_repo, wa_account_repo)


def get_wa_account_service(
    repo: WhatsAppAccountRepository = Depends(get_wa_account_repo),
) -> WhatsAppAccountService:
    return WhatsAppAccountService(repo)


def get_wa_template_service(
    template_repo: WhatsAppTemplateRepository = Depends(get_wa_template_repo),
    account_repo: WhatsAppAccountRepository = Depends(get_wa_account_repo),
) -> WhatsAppTemplateService:
    return WhatsAppTemplateService(template_repo, account_repo)

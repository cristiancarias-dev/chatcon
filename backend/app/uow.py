from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.contact_repository import ContactRepository
from app.repositories.conversation_repository import (
    ConversationRepository,
    MessageRepository,
)
from app.repositories.role_repository import PermissionRepository, RoleRepository
from app.repositories.user_repository import UserRepository
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.repositories.whatsapp_template_repository import WhatsAppTemplateRepository


class UnitOfWork:
    def __init__(self, db: Session):
        self._db = db
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)
        self.permissions = PermissionRepository(db)
        self.contacts = ContactRepository(db)
        self.conversations = ConversationRepository(db)
        self.messages = MessageRepository(db)
        self.whatsapp_accounts = WhatsAppAccountRepository(db)
        self.whatsapp_templates = WhatsAppTemplateRepository(db)

    def commit(self) -> None:
        self._db.commit()

    def rollback(self) -> None:
        self._db.rollback()

    def flush(self) -> None:
        self._db.flush()

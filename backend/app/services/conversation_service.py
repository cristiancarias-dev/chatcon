import logging
from datetime import UTC, datetime

from app.auth.authorization import is_admin
from app.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.providers.whatsapp import WhatsAppError, WhatsAppProvider
from app.repositories.conversation_repository import (
    ConversationRepository,
    MessageRepository,
)
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.repositories.whatsapp_template_repository import WhatsAppTemplateRepository
from app.schemas.conversation import (
    ConversationCreate,
    ConversationDetail,
    ConversationRead,
    ConversationUpdate,
    MessageCreate,
    MessageRead,
)

log = logging.getLogger(__name__)


class ConversationService:
    def __init__(
        self,
        conv_repo: ConversationRepository,
        msg_repo: MessageRepository,
        wa_account_repo: WhatsAppAccountRepository,
        template_repo: WhatsAppTemplateRepository,
    ):
        self.conv_repo = conv_repo
        self.msg_repo = msg_repo
        self.wa_account_repo = wa_account_repo
        self.template_repo = template_repo

    def _build_conversation_read(
        self, conv: Conversation
    ) -> ConversationRead:
        last_msg = self.msg_repo.get_last_message(conv.id)
        return ConversationRead(
            id=conv.id,
            contact_id=conv.contact_id,
            contact_name=conv.contact.name,
            contact_phone=conv.contact.phone,
            assigned_agent_id=conv.assigned_agent_id,
            whatsapp_account_id=conv.whatsapp_account_id,
            status=conv.status,
            message_count=self.conv_repo.get_message_count(conv.id),
            unread_count=self.conv_repo.get_unread_count(conv.id),
            last_message=last_msg.content if last_msg else None,
            last_message_at=last_msg.created_at if last_msg else None,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        )

    def get_all(
        self,
        current_user: User,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
        search: str | None = None,
    ) -> list[ConversationRead]:
        agent_id = None if is_admin(current_user) else current_user.id
        company_id = current_user.company_id
        conversations = self.conv_repo.get_all(
            skip, limit, agent_id=agent_id, status=status, search=search, company_id=company_id
        )
        return [self._build_conversation_read(c) for c in conversations]

    def count_all(
        self,
        current_user: User,
        status: str | None = None,
        search: str | None = None,
    ) -> dict:
        agent_id = None if is_admin(current_user) else current_user.id
        company_id = current_user.company_id
        total = self.conv_repo.count_all(agent_id=agent_id, status=status, search=search, company_id=company_id)
        return {"count": total}

    def get_by_id(self, conversation_id: int, current_user: User) -> ConversationDetail:
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv:
            raise NotFoundException("Conversation not found")
        if not is_admin(current_user) and conv.assigned_agent_id != current_user.id:
            raise ForbiddenException("You can only view your own conversations")
        return ConversationDetail(
            id=conv.id,
            contact_id=conv.contact_id,
            contact_name=conv.contact.name,
            contact_phone=conv.contact.phone,
            assigned_agent_id=conv.assigned_agent_id,
            status=conv.status,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        )

    def create(self, data: ConversationCreate, current_user: User) -> ConversationRead:
        contact = self.conv_repo.get_contact_by_id(data.contact_id)
        if not contact:
            raise NotFoundException("Contact not found")
        existing = self.conv_repo.get_by_contact(data.contact_id)
        if existing:
            raise ConflictException("A conversation with this contact already exists")

        conv = Conversation(
            contact_id=data.contact_id,
            assigned_agent_id=data.assigned_agent_id or contact.assigned_agent_id or current_user.id,
            whatsapp_account_id=data.whatsapp_account_id,
            status="open",
        )
        conv = self.conv_repo.create(conv)
        return self._build_conversation_read(conv)

    def update_status(
        self, conversation_id: int, status: str, current_user: User
    ) -> ConversationRead:
        if status not in ("open", "closed"):
            raise ValueError("Status must be 'open' or 'closed'")
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv:
            raise NotFoundException("Conversation not found")
        if not is_admin(current_user) and conv.assigned_agent_id != current_user.id:
            raise ForbiddenException("You can only modify your own conversations")
        conv.status = status
        conv = self.conv_repo.save(conv)
        return self._build_conversation_read(conv)

    def update(
        self, conversation_id: int, data: ConversationUpdate, current_user: User
    ) -> ConversationRead:
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv:
            raise NotFoundException("Conversation not found")
        if not is_admin(current_user) and conv.assigned_agent_id != current_user.id:
            raise ForbiddenException("You can only modify your own conversations")
        if data.whatsapp_account_id is not None:
            conv.whatsapp_account_id = data.whatsapp_account_id
        conv = self.conv_repo.save(conv)
        return self._build_conversation_read(conv)

    def get_messages(
        self,
        conversation_id: int,
        current_user: User,
        skip: int = 0,
        limit: int = 100,
    ) -> list[MessageRead]:
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv:
            raise NotFoundException("Conversation not found")
        if not is_admin(current_user) and conv.assigned_agent_id != current_user.id:
            raise ForbiddenException("You can only view your own conversations")

        messages = self.msg_repo.get_by_conversation(conversation_id, skip, limit)
        return [
            MessageRead(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_type=m.sender_type,
                content=m.content,
                message_type=m.message_type,
                template_name=m.template_name,
                is_read=m.is_read,
                whatsapp_message_id=m.whatsapp_message_id,
                whatsapp_error_code=m.whatsapp_error_code,
                whatsapp_error_message=m.whatsapp_error_message,
                created_at=m.created_at,
            )
            for m in messages
        ]

    def send_message(
        self,
        conversation_id: int,
        data: MessageCreate,
        current_user: User,
    ) -> MessageRead:
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv:
            raise NotFoundException("Conversation not found")
        if not is_admin(current_user) and conv.assigned_agent_id != current_user.id:
            raise ForbiddenException("You can only send messages in your own conversations")
        if conv.status == "closed":
            raise ConflictException("Cannot send messages in a closed conversation")

        msg = Message(
            conversation_id=conversation_id,
            sender_type="agent",
            content=data.content,
            message_type=data.message_type or "text",
            template_name=data.template_name,
        )
        msg = self.msg_repo.create(msg)

        conv.contact.last_contacted_at = datetime.now(UTC)

        template_params = data.template_params
        whatsapp_status = self._send_via_whatsapp(conv, msg, template_params)

        self.msg_repo.save(msg)

        return MessageRead(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_type=msg.sender_type,
            content=msg.content,
            message_type=msg.message_type,
            template_name=msg.template_name,
            is_read=msg.is_read,
            whatsapp_status=whatsapp_status,
            whatsapp_message_id=msg.whatsapp_message_id,
            whatsapp_error_code=msg.whatsapp_error_code,
            whatsapp_error_message=msg.whatsapp_error_message,
            created_at=msg.created_at,
        )

    def _send_via_whatsapp(
        self, conv: Conversation, msg: Message, template_params: list[str] | None = None
    ) -> str | None:
        if not conv.whatsapp_account_id:
            return None
        account = self.wa_account_repo.get_by_id(conv.whatsapp_account_id)
        if not account:
            return "no_account"
        if not account.is_active:
            return "inactive"
        try:
            provider = WhatsAppProvider(account)
            to = conv.contact.phone

            if msg.message_type == "template" and msg.template_name:
                template = self.template_repo.get_by_name(account.id, msg.template_name)
                language = template.language if template else "en_US"
                resp = provider.send_template(to, msg.template_name, language, template_params)
            else:
                try:
                    resp = provider.send_text(to, msg.content)
                except WhatsAppError as e:
                    if e.code == 131047 and account.default_template_name:
                        log.warning("131047 fallback to template %s", account.default_template_name)
                        fallback_template = self.template_repo.get_by_name(account.id, account.default_template_name)
                        fallback_language = fallback_template.language if fallback_template else "en_US"
                        resp = provider.send_template(to, account.default_template_name, fallback_language)
                        msg.message_type = "template"
                        msg.template_name = account.default_template_name
                    else:
                        raise

            wam_ids = resp.get("messages", [])
            if wam_ids:
                msg.whatsapp_message_id = wam_ids[0].get("id")
            return "sent"

        except WhatsAppError as e:
            log.error("WhatsApp send failed [%d]: %s", e.code, e.details)
            msg.whatsapp_error_code = e.code
            msg.whatsapp_error_message = f"{e.title}: {e.details}" if e.details else e.title
            if e.code == 131047:
                return "requires_template"
            return "error"

        except Exception as e:
            log.error("WhatsApp send failed: %s", e)
            return "error"

    def mark_read(self, conversation_id: int, current_user: User) -> dict:
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv:
            raise NotFoundException("Conversation not found")
        if not is_admin(current_user) and conv.assigned_agent_id != current_user.id:
            raise ForbiddenException("Forbidden")
        updated = self.msg_repo.mark_all_as_read(conversation_id)
        self.conv_repo._db.commit()
        return {"updated": updated}

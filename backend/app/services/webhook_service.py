import logging
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.conversation import Conversation, Message
from app.repositories.contact_repository import ContactRepository
from app.repositories.conversation_repository import (
    ConversationRepository,
    MessageRepository,
)
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.repositories.whatsapp_template_repository import WhatsAppTemplateRepository

log = logging.getLogger(__name__)


@dataclass
class BroadcastEvent:
    conversation_id: int
    event_type: str
    payload: dict


class WebhookService:
    """Process incoming WhatsApp webhook payloads.

    Handles message ingestion and status updates, creating contacts,
    conversations, and messages as needed.
    """

    def __init__(self, db: Session):
        self.contact_repo = ContactRepository(db)
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)
        self.wa_account_repo = WhatsAppAccountRepository(db)
        self.template_repo = WhatsAppTemplateRepository(db)
        self.broadcasts: list[BroadcastEvent] = []

    def process_message(self, body: dict) -> None:
        entries = body.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                metadata = value.get("metadata", {})
                if not messages:
                    continue

                phone_number_id = metadata.get("phone_number_id", "")
                account = self.wa_account_repo.get_by_phone_number_id(phone_number_id)
                if not account:
                    log.warning("No WhatsApp account found for phone_number_id=%s, entry skipped", phone_number_id)
                    continue

                for msg_data in messages:
                    self._process_single_message(msg_data, account.id)

    def process_statuses(self, body: dict) -> None:
        entries = body.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                statuses = value.get("statuses", [])
                if not statuses:
                    continue

                for status_data in statuses:
                    self._process_single_status(status_data)

    def _process_single_message(self, msg_data: dict, account_id: int) -> None:
        from_number = msg_data.get("from", "")
        msg_type = msg_data.get("type", "text")
        wa_msg_id = msg_data.get("id", "")

        text = ""
        if msg_type == "text":
            text = (msg_data.get("text") or {}).get("body", "")

        account = self.wa_account_repo.get_by_id(account_id)
        company_id = account.company_id if account else None

        contact = self.contact_repo.get_by_phone(from_number)
        if not contact:
            contact = Contact(
                name=from_number,
                phone=from_number,
                notes="Auto-created from WhatsApp",
                company_id=company_id,
            )
            contact = self.contact_repo.create(contact)

        conv = self.conv_repo.get_by_contact_and_account(contact.id, account_id)
        if not conv:
            conv = Conversation(
                contact_id=contact.id,
                whatsapp_account_id=account_id,
                status="open",
            )
            conv = self.conv_repo.create(conv)

        last_msg = self.msg_repo.get_last_message(conv.id)
        if last_msg and last_msg.whatsapp_message_id == wa_msg_id:
            return

        msg = Message(
            conversation_id=conv.id,
            sender_type="contact",
            content=text,
            message_type=msg_type,
            whatsapp_message_id=wa_msg_id,
            is_read=False,
        )
        self.msg_repo.create(msg)

        self.broadcasts.append(BroadcastEvent(
            conversation_id=conv.id,
            event_type="new_message",
            payload={
                "type": "new_message",
                "message": {
                    "id": msg.id,
                    "conversation_id": msg.conversation_id,
                    "sender_type": msg.sender_type,
                    "content": msg.content,
                    "message_type": msg.message_type,
                    "template_name": msg.template_name,
                    "is_read": msg.is_read,
                    "whatsapp_message_id": msg.whatsapp_message_id,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                },
            },
        ))

    def _process_single_status(self, status_data: dict) -> None:
        wa_msg_id = status_data.get("id", "")
        status = status_data.get("status", "")
        if not wa_msg_id:
            return

        messages = self.msg_repo.get_by_whatsapp_message_id(wa_msg_id)

        for msg in messages:
            if status == "failed":
                errors = status_data.get("errors", [])
                if errors:
                    err = errors[0]
                    msg.whatsapp_error_code = err.get("code")
                    msg.whatsapp_error_message = (
                        err.get("message") or err.get("title", "")
                    )
        if messages:
            self.msg_repo._db.commit()

            m = messages[0]
            self.broadcasts.append(BroadcastEvent(
                conversation_id=m.conversation_id,
                event_type="status_update",
                payload={
                    "type": "status_update",
                    "message_id": m.id,
                    "whatsapp_status": "error" if status == "failed" else status,
                    "whatsapp_error_code": m.whatsapp_error_code,
                    "whatsapp_error_message": m.whatsapp_error_message,
                },
            ))

    def process_template_status(self, body: dict) -> None:
        entries = body.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                event = value.get("event", "")
                if event != "message_template_status_update":
                    continue
                template_data = value.get("message_template", {})
                template_id = template_data.get("id", "")
                status = template_data.get("status", "")
                if template_id and status:
                    t = self.template_repo.get_by_meta_id(template_id)
                    if t:
                        t.status = status
                        self.template_repo.save(t)

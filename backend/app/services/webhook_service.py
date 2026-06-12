import logging

from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.conversation import Conversation, Message
from app.repositories.contact_repository import ContactRepository
from app.repositories.conversation_repository import (
    ConversationRepository,
    MessageRepository,
)
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository

log = logging.getLogger(__name__)


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

        contact = self.contact_repo.get_by_phone(from_number)
        if not contact:
            contact = Contact(
                name=from_number,
                phone=from_number,
                notes="Auto-created from WhatsApp",
            )
            contact = self.contact_repo.create(contact)

        conv = self.conv_repo.get_by_contact(contact.id)
        if not conv or conv.whatsapp_account_id != account_id:
            conv = Conversation(
                contact_id=contact.id,
                whatsapp_account_id=account_id,
                status="open",
            )
            conv = self.conv_repo.create(conv)

        last_msg = self.msg_repo.get_last_message(conv.id)
        if last_msg and last_msg.sender_type == "contact" and last_msg.content == text:
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

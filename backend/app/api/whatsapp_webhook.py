import logging

from fastapi import APIRouter, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.conversation import Conversation, Message
from app.models.contact import Contact
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/webhook")
def verify_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    from app.config import settings

    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_webhook_verify_token:
        return int(hub_challenge) if hub_challenge and hub_challenge.isdigit() else hub_challenge
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request):
    body = await request.json()
    db = SessionLocal()
    try:
        _process_whatsapp_message(body, db)
        _process_whatsapp_statuses(body, db)
    except Exception:
        log.exception("Error processing webhook")
    finally:
        db.close()
    return {"status": "ok"}


def _process_whatsapp_message(body: dict, db: Session):
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
            wa_repo = WhatsAppAccountRepository(db)
            account = wa_repo.get_by_phone_number_id(phone_number_id)
            if not account:
                continue

            for msg_data in messages:
                from_number = msg_data.get("from", "")
                msg_type = msg_data.get("type", "text")
                wa_msg_id = msg_data.get("id", "")

                text = ""
                if msg_type == "text":
                    text = (msg_data.get("text") or {}).get("body", "")

                contact = (
                    db.query(Contact).filter(Contact.phone == from_number).first()
                )
                if not contact:
                    contact = Contact(
                        name=from_number,
                        phone=from_number,
                        notes="Auto-created from WhatsApp",
                    )
                    db.add(contact)
                    db.flush()

                conv = (
                    db.query(Conversation)
                    .filter(
                        Conversation.contact_id == contact.id,
                        Conversation.whatsapp_account_id == account.id,
                    )
                    .first()
                )
                if not conv:
                    conv = Conversation(
                        contact_id=contact.id,
                        whatsapp_account_id=account.id,
                        status="open",
                    )
                    db.add(conv)
                    db.flush()

                existing = (
                    db.query(Message)
                    .filter(
                        Message.conversation_id == conv.id,
                        Message.sender_type == "contact",
                    )
                    .order_by(Message.created_at.desc())
                    .first()
                )
                if existing and existing.content == text:
                    continue

                msg = Message(
                    conversation_id=conv.id,
                    sender_type="contact",
                    content=text,
                    message_type=msg_type,
                    whatsapp_message_id=wa_msg_id,
                    is_read=False,
                )
                db.add(msg)
                db.commit()


def _process_whatsapp_statuses(body: dict, db: Session):
    entries = body.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            statuses = value.get("statuses", [])
            if not statuses:
                continue

            for status_data in statuses:
                wa_msg_id = status_data.get("id", "")
                status = status_data.get("status", "")
                if not wa_msg_id:
                    continue

                msg = (
                    db.query(Message)
                    .filter(Message.whatsapp_message_id == wa_msg_id)
                    .first()
                )
                if not msg:
                    continue

                if status == "failed":
                    errors = status_data.get("errors", [])
                    if errors:
                        err = errors[0]
                        msg.whatsapp_error_code = err.get("code")
                        msg.whatsapp_error_message = (
                            err.get("message") or err.get("title", "")
                        )
                    db.commit()

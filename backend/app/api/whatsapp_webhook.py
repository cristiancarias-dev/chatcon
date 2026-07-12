import logging

from fastapi import APIRouter, HTTPException, Query, Request

from app.config import settings
from app.database import SessionLocal
from app.services.webhook_service import WebhookService

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/webhook")
def verify_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_webhook_verify_token:
        return int(hub_challenge) if hub_challenge and hub_challenge.isdigit() else hub_challenge
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request):
    body = await request.json()
    db = SessionLocal()
    try:
        service = WebhookService(db)
        service.process_message(body)
        service.process_statuses(body)
        service.process_template_status(body)

        if service.broadcasts:
            from app.api.websocket import manager
            log.info("Broadcasting %d events via WS", len(service.broadcasts))
            for event in service.broadcasts:
                try:
                    await manager.broadcast(event.conversation_id, event.payload)
                except Exception:
                    log.debug("Could not broadcast event via WS: %s", event.event_type)
    except Exception:
        log.exception("Error processing webhook")
    finally:
        db.close()
    return {"status": "ok"}

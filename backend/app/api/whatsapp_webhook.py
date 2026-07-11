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
    except Exception:
        log.exception("Error processing webhook")
    finally:
        db.close()
    return {"status": "ok"}

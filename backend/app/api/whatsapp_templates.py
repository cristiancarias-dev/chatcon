from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.database import get_db
from app.models.user import User
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.repositories.whatsapp_template_repository import WhatsAppTemplateRepository
from app.schemas.whatsapp_template import WhatsAppTemplateCreate, WhatsAppTemplateRead
from app.services.whatsapp_template_service import WhatsAppTemplateService

router = APIRouter()


@router.get("/accounts/{account_id}/templates", response_model=list[WhatsAppTemplateRead])
def list_templates(
    account_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    db: Session = Depends(get_db),
):
    service = WhatsAppTemplateService(
        WhatsAppTemplateRepository(db),
        WhatsAppAccountRepository(db),
    )
    return service.list_templates(account_id)


@router.post(
    "/accounts/{account_id}/templates/refresh",
    response_model=list[WhatsAppTemplateRead],
)
def refresh_templates(
    account_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    db: Session = Depends(get_db),
):
    service = WhatsAppTemplateService(
        WhatsAppTemplateRepository(db),
        WhatsAppAccountRepository(db),
    )
    try:
        return service.refresh_from_meta(account_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/accounts/{account_id}/templates",
    response_model=WhatsAppTemplateRead,
    status_code=201,
)
def create_template(
    account_id: int,
    data: WhatsAppTemplateCreate,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    db: Session = Depends(get_db),
):
    service = WhatsAppTemplateService(
        WhatsAppTemplateRepository(db),
        WhatsAppAccountRepository(db),
    )
    try:
        return service.create_template(account_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/accounts/{account_id}/templates/{template_id}", status_code=204)
def delete_template(
    account_id: int,
    template_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    db: Session = Depends(get_db),
):
    service = WhatsAppTemplateService(
        WhatsAppTemplateRepository(db),
        WhatsAppAccountRepository(db),
    )
    service.delete_template(template_id)

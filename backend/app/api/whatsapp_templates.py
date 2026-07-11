from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_permission
from app.dependencies import get_wa_template_service
from app.models.user import User
from app.schemas.whatsapp_template import (
    WhatsAppTemplateCreate,
    WhatsAppTemplateRead,
    WhatsAppTemplateUpdate,
)
from app.services.whatsapp_template_service import WhatsAppTemplateService

router = APIRouter()


@router.get("/accounts/{account_id}/templates", response_model=list[WhatsAppTemplateRead])
def list_templates(
    account_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    service: WhatsAppTemplateService = Depends(get_wa_template_service),
):
    return service.list_templates(account_id)


@router.get("/accounts/{account_id}/templates/{template_id}", response_model=WhatsAppTemplateRead)
def get_template(
    account_id: int,
    template_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    service: WhatsAppTemplateService = Depends(get_wa_template_service),
):
    try:
        return service.get_template(template_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/accounts/{account_id}/templates/refresh",
    response_model=list[WhatsAppTemplateRead],
)
def refresh_templates(
    account_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    service: WhatsAppTemplateService = Depends(get_wa_template_service),
):
    try:
        return service.refresh_from_meta(account_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/accounts/{account_id}/templates/sync",
    response_model=list[WhatsAppTemplateRead],
)
def sync_templates(
    account_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    service: WhatsAppTemplateService = Depends(get_wa_template_service),
):
    try:
        return service.sync_orphans(account_id)
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
    service: WhatsAppTemplateService = Depends(get_wa_template_service),
):
    try:
        return service.create_template(account_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/accounts/{account_id}/templates/{template_id}", response_model=WhatsAppTemplateRead)
def update_template(
    account_id: int,
    template_id: int,
    data: WhatsAppTemplateUpdate,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    service: WhatsAppTemplateService = Depends(get_wa_template_service),
):
    try:
        return service.update_template(template_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/accounts/{account_id}/templates/{template_id}", status_code=204)
def delete_template(
    account_id: int,
    template_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    service: WhatsAppTemplateService = Depends(get_wa_template_service),
):
    service.delete_template(template_id)

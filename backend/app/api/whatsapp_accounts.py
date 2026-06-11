from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.database import get_db
from app.models.user import User
from app.providers.whatsapp import WhatsAppProvider
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.schemas.whatsapp_account import (
    WhatsAppAccountCreate,
    WhatsAppAccountRead,
    WhatsAppAccountUpdate,
)
from app.services.whatsapp_account_service import WhatsAppAccountService

router = APIRouter()


def get_repo(db: Session = Depends(get_db)) -> WhatsAppAccountRepository:
    return WhatsAppAccountRepository(db)


@router.get("/", response_model=list[WhatsAppAccountRead])
def list_accounts(
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    repo: WhatsAppAccountRepository = Depends(get_repo),
):
    service = WhatsAppAccountService(repo)
    return service.get_all()


@router.post("/", response_model=WhatsAppAccountRead, status_code=201)
def create_account(
    data: WhatsAppAccountCreate,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    repo: WhatsAppAccountRepository = Depends(get_repo),
):
    service = WhatsAppAccountService(repo)
    return service.create(data)


@router.get("/{account_id}", response_model=WhatsAppAccountRead)
def read_account(
    account_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    repo: WhatsAppAccountRepository = Depends(get_repo),
):
    service = WhatsAppAccountService(repo)
    return service.get_by_id(account_id)


@router.patch("/{account_id}", response_model=WhatsAppAccountRead)
def update_account(
    account_id: int,
    data: WhatsAppAccountUpdate,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    repo: WhatsAppAccountRepository = Depends(get_repo),
):
    service = WhatsAppAccountService(repo)
    return service.update(account_id, data)


@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    repo: WhatsAppAccountRepository = Depends(get_repo),
):
    service = WhatsAppAccountService(repo)
    service.delete(account_id)


@router.post("/{account_id}/subscribe-webhook")
def subscribe_webhook(
    account_id: int,
    current_user: User = Depends(require_permission("manage_whatsapp_accounts")),
    repo: WhatsAppAccountRepository = Depends(get_repo),
):
    account = repo.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="WhatsApp account not found")
    if not account.business_account_id:
        raise HTTPException(
            status_code=400,
            detail="WhatsApp account has no WABA ID (business_account_id)",
        )
    try:
        provider = WhatsAppProvider(account)
        result = provider.subscribe_to_waba()
        return {"success": result.get("success", True)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

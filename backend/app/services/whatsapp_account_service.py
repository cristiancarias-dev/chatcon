from app.crypto import encrypt_value
from app.exceptions import NotFoundException
from app.models.whatsapp_account import WhatsAppAccount
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.schemas.whatsapp_account import (
    WhatsAppAccountCreate,
    WhatsAppAccountRead,
    WhatsAppAccountUpdate,
)


class WhatsAppAccountService:
    def __init__(self, repo: WhatsAppAccountRepository):
        self.repo = repo

    def _mask_token(self, token: str) -> str:
        if len(token) <= 8:
            return "****"
        return token[:4] + "****" + token[-4:]

    def _to_read(self, account: WhatsAppAccount) -> WhatsAppAccountRead:
        return WhatsAppAccountRead(
            id=account.id,
            name=account.name,
            phone_number_id=account.phone_number_id,
            phone_number=account.phone_number,
            business_account_id=account.business_account_id,
            default_template_name=account.default_template_name,
            access_token_preview=self._mask_token(account.access_token_encrypted),
            api_version=account.api_version,
            is_active=account.is_active,
            created_at=account.created_at,
            updated_at=account.updated_at,
        )

    def get_all(self) -> list[WhatsAppAccountRead]:
        return [self._to_read(a) for a in self.repo.get_all()]

    def get_by_id(self, account_id: int) -> WhatsAppAccountRead:
        account = self.repo.get_by_id(account_id)
        if not account:
            raise NotFoundException("WhatsApp account not found")
        return self._to_read(account)

    def create(self, data: WhatsAppAccountCreate) -> WhatsAppAccountRead:
        account = WhatsAppAccount(
            name=data.name,
            phone_number_id=data.phone_number_id,
            phone_number=data.phone_number,
            business_account_id=data.business_account_id or None,
            access_token_encrypted=encrypt_value(data.access_token),
            api_version=data.api_version or "v22.0",
            is_active=data.is_active,
            default_template_name=data.default_template_name or None,
        )
        account = self.repo.create(account)
        return self._to_read(account)

    def update(self, account_id: int, data: WhatsAppAccountUpdate) -> WhatsAppAccountRead:
        account = self.repo.get_by_id(account_id)
        if not account:
            raise NotFoundException("WhatsApp account not found")
        if data.name is not None:
            account.name = data.name
        if data.phone_number_id is not None:
            account.phone_number_id = data.phone_number_id
        if data.phone_number is not None:
            account.phone_number = data.phone_number
        if data.access_token is not None:
            account.access_token_encrypted = encrypt_value(data.access_token)
        if data.api_version is not None:
            account.api_version = data.api_version
        if data.is_active is not None:
            account.is_active = data.is_active
        if data.business_account_id is not None:
            account.business_account_id = data.business_account_id or None
        if data.default_template_name is not None:
            account.default_template_name = data.default_template_name or None
        account = self.repo.save(account)
        return self._to_read(account)

    def delete(self, account_id: int) -> None:
        if not self.repo.delete_by_id(account_id):
            raise NotFoundException("WhatsApp account not found")

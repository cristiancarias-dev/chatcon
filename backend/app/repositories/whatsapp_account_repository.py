from sqlalchemy.orm import Session

from app.models.whatsapp_account import WhatsAppAccount
from app.repositories.base import BaseRepository


class WhatsAppAccountRepository(BaseRepository[WhatsAppAccount]):
    def __init__(self, db: Session):
        super().__init__(db, WhatsAppAccount)

    def get_all(self, company_id: int | None = None) -> list[WhatsAppAccount]:
        q = self._db.query(WhatsAppAccount)
        if company_id is not None:
            q = q.filter(WhatsAppAccount.company_id == company_id)
        return q.order_by(WhatsAppAccount.created_at.desc()).all()

    def get_active(self, company_id: int | None = None) -> list[WhatsAppAccount]:
        q = self._db.query(WhatsAppAccount).filter(WhatsAppAccount.is_active == True)
        if company_id is not None:
            q = q.filter(WhatsAppAccount.company_id == company_id)
        return q.all()

    def get_by_phone_number_id(self, phone_number_id: str) -> WhatsAppAccount | None:
        return (
            self._db.query(WhatsAppAccount)
            .filter(WhatsAppAccount.phone_number_id == phone_number_id)
            .first()
        )

    def delete_by_id(self, account_id: int) -> bool:
        acct = self.get_by_id(account_id)
        if not acct:
            return False
        self._db.delete(acct)
        self._db.commit()
        return True

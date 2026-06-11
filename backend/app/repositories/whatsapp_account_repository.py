from sqlalchemy.orm import Session

from app.models.whatsapp_account import WhatsAppAccount


class WhatsAppAccountRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> list[WhatsAppAccount]:
        return self.db.query(WhatsAppAccount).order_by(WhatsAppAccount.created_at.desc()).all()

    def get_active(self) -> list[WhatsAppAccount]:
        return (
            self.db.query(WhatsAppAccount)
            .filter(WhatsAppAccount.is_active == True)
            .all()
        )

    def get_by_id(self, account_id: int) -> WhatsAppAccount | None:
        return self.db.query(WhatsAppAccount).filter(WhatsAppAccount.id == account_id).first()

    def get_by_phone_number_id(self, phone_number_id: str) -> WhatsAppAccount | None:
        return (
            self.db.query(WhatsAppAccount)
            .filter(WhatsAppAccount.phone_number_id == phone_number_id)
            .first()
        )

    def create(self, account: WhatsAppAccount) -> WhatsAppAccount:
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account

    def save(self, account: WhatsAppAccount) -> WhatsAppAccount:
        self.db.commit()
        self.db.refresh(account)
        return account

    def delete(self, account_id: int) -> bool:
        acct = self.get_by_id(account_id)
        if not acct:
            return False
        self.db.delete(acct)
        self.db.commit()
        return True

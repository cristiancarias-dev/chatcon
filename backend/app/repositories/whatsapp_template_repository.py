from sqlalchemy.orm import Session

from app.models.whatsapp_template import WhatsAppTemplate
from app.repositories.base import BaseRepository


class WhatsAppTemplateRepository(BaseRepository[WhatsAppTemplate]):
    def __init__(self, db: Session):
        super().__init__(db, WhatsAppTemplate)

    def get_by_account(self, account_id: int) -> list[WhatsAppTemplate]:
        return (
            self._db.query(WhatsAppTemplate)
            .filter(WhatsAppTemplate.account_id == account_id)
            .order_by(WhatsAppTemplate.name)
            .all()
        )

    def get_by_name(self, account_id: int, name: str) -> WhatsAppTemplate | None:
        return (
            self._db.query(WhatsAppTemplate)
            .filter(
                WhatsAppTemplate.account_id == account_id,
                WhatsAppTemplate.name == name,
            )
            .first()
        )

    def delete_by_id(self, template_id: int) -> bool:
        template = self.get_by_id(template_id)
        if not template:
            return False
        self._db.delete(template)
        self._db.commit()
        return True

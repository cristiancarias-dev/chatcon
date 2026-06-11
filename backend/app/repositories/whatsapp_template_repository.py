from sqlalchemy.orm import Session

from app.models.whatsapp_template import WhatsAppTemplate


class WhatsAppTemplateRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_account(self, account_id: int) -> list[WhatsAppTemplate]:
        return (
            self.db.query(WhatsAppTemplate)
            .filter(WhatsAppTemplate.account_id == account_id)
            .order_by(WhatsAppTemplate.name)
            .all()
        )

    def get_by_id(self, template_id: int) -> WhatsAppTemplate | None:
        return self.db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == template_id).first()

    def get_by_name(self, account_id: int, name: str) -> WhatsAppTemplate | None:
        return (
            self.db.query(WhatsAppTemplate)
            .filter(
                WhatsAppTemplate.account_id == account_id,
                WhatsAppTemplate.name == name,
            )
            .first()
        )

    def create(self, template: WhatsAppTemplate) -> WhatsAppTemplate:
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def delete(self, template_id: int) -> bool:
        template = self.get_by_id(template_id)
        if not template:
            return False
        self.db.delete(template)
        self.db.commit()
        return True

from sqlalchemy.orm import Session

from app.models.contact import Contact


class ContactRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, contact_id: int) -> Contact | None:
        return self.db.query(Contact).filter(Contact.id == contact_id).first()

    def get_by_phone(self, phone: str) -> Contact | None:
        return self.db.query(Contact).filter(Contact.phone == phone).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        agent_id: int | None = None,
        search: str | None = None,
    ) -> list[Contact]:
        q = self.db.query(Contact)
        if agent_id is not None:
            q = q.filter(Contact.assigned_agent_id == agent_id)
        if search:
            pattern = f"%{search}%"
            q = q.filter(
                Contact.name.ilike(pattern) | Contact.phone.ilike(pattern)
            )
        return q.order_by(Contact.created_at.desc()).offset(skip).limit(limit).all()

    def count_all(self, agent_id: int | None = None, search: str | None = None) -> int:
        q = self.db.query(Contact)
        if agent_id is not None:
            q = q.filter(Contact.assigned_agent_id == agent_id)
        if search:
            pattern = f"%{search}%"
            q = q.filter(
                Contact.name.ilike(pattern) | Contact.phone.ilike(pattern)
            )
        return q.count()

    def create(self, contact: Contact) -> Contact:
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def save(self, contact: Contact) -> Contact:
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def delete(self, contact: Contact) -> None:
        self.db.delete(contact)
        self.db.commit()

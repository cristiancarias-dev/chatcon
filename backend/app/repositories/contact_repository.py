from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.repositories.base import BaseRepository


class ContactRepository(BaseRepository[Contact]):
    def __init__(self, db: Session):
        super().__init__(db, Contact)

    def get_by_phone(self, phone: str) -> Contact | None:
        return self._db.query(Contact).filter(Contact.phone == phone).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        agent_id: int | None = None,
        search: str | None = None,
    ) -> list[Contact]:
        q = self._db.query(Contact)
        if agent_id is not None:
            q = q.filter(Contact.assigned_agent_id == agent_id)
        if search:
            pattern = f"%{search}%"
            q = q.filter(
                Contact.name.ilike(pattern) | Contact.phone.ilike(pattern)
            )
        return q.order_by(Contact.created_at.desc()).offset(skip).limit(limit).all()

    def count_all(
        self, agent_id: int | None = None, search: str | None = None
    ) -> int:
        q = self._db.query(Contact)
        if agent_id is not None:
            q = q.filter(Contact.assigned_agent_id == agent_id)
        if search:
            pattern = f"%{search}%"
            q = q.filter(
                Contact.name.ilike(pattern) | Contact.phone.ilike(pattern)
            )
        return q.count()

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(db, User)

    def get_by_email(self, email: str) -> User | None:
        return self._db.query(User).filter(User.email == email).first()

    def get_all(self, skip: int = 0, limit: int = 100, company_id: int | None = None) -> list[User]:
        q = self._db.query(User)
        if company_id is not None:
            q = q.filter(User.company_id == company_id)
        return q.offset(skip).limit(limit).all()

    def count_all(self, company_id: int | None = None) -> int:
        q = self._db.query(User)
        if company_id is not None:
            q = q.filter(User.company_id == company_id)
        return q.count()

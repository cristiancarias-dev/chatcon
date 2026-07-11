from sqlalchemy.orm import Session

from app.models.company import Company
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    def __init__(self, db: Session):
        super().__init__(db, Company)

    def get_by_name(self, name: str) -> Company | None:
        return self._db.query(Company).filter(Company.name == name).first()

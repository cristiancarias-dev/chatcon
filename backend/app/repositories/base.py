from abc import ABC
from typing import Generic, TypeVar

from sqlalchemy.orm import Session

from app.database import Base

T = TypeVar("T", bound=Base)


class BaseRepository(ABC, Generic[T]):
    def __init__(self, db: Session, model: type[T]):
        self._db = db
        self._model = model

    def get_by_id(self, entity_id: int) -> T | None:
        return self._db.query(self._model).filter(self._model.id == entity_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[T]:
        return self._db.query(self._model).offset(skip).limit(limit).all()

    def create(self, entity: T) -> T:
        self._db.add(entity)
        self._db.commit()
        self._db.refresh(entity)
        return entity

    def save(self, entity: T) -> T:
        self._db.commit()
        self._db.refresh(entity)
        return entity

    def delete(self, entity: T) -> None:
        self._db.delete(entity)
        self._db.commit()

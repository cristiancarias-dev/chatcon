from sqlalchemy.orm import Session

from app.models.role import Permission, Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: Session):
        super().__init__(db, Role)

    def get_by_name(self, name: str) -> Role | None:
        return self._db.query(Role).filter(Role.name == name).first()

    def get_by_names(self, names: list[str]) -> list[Role]:
        return self._db.query(Role).filter(Role.name.in_(names)).all()

    def get_all(self) -> list[Role]:
        return self._db.query(Role).all()


class PermissionRepository(BaseRepository[Permission]):
    def __init__(self, db: Session):
        super().__init__(db, Permission)

    def get_by_ids(self, ids: list[int]) -> list[Permission]:
        return self._db.query(Permission).filter(Permission.id.in_(ids)).all()

    def get_by_codenames(self, codenames: list[str]) -> list[Permission]:
        return self._db.query(Permission).filter(Permission.codename.in_(codenames)).all()

    def get_by_codename(self, codename: str) -> Permission | None:
        return self._db.query(Permission).filter(Permission.codename == codename).first()

    def get_all(self) -> list[Permission]:
        return self._db.query(Permission).order_by(Permission.codename).all()

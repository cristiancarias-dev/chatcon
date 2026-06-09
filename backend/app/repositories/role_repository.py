from sqlalchemy.orm import Session

from app.models.role import Permission, Role


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, role_id: int) -> Role | None:
        return self.db.query(Role).filter(Role.id == role_id).first()

    def get_by_name(self, name: str) -> Role | None:
        return self.db.query(Role).filter(Role.name == name).first()

    def get_all(self) -> list[Role]:
        return self.db.query(Role).all()

    def create(self, role: Role) -> Role:
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def save(self, role: Role) -> Role:
        self.db.commit()
        self.db.refresh(role)
        return role

    def delete(self, role: Role) -> None:
        self.db.delete(role)
        self.db.commit()


class PermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, perm_id: int) -> Permission | None:
        return self.db.query(Permission).filter(Permission.id == perm_id).first()

    def get_by_ids(self, ids: list[int]) -> list[Permission]:
        return self.db.query(Permission).filter(Permission.id.in_(ids)).all()

    def get_all(self) -> list[Permission]:
        return self.db.query(Permission).order_by(Permission.codename).all()

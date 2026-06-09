import csv
import io
from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.exceptions import AppException
from app.models.user import User
from app.models.role import Permission, Role


class ImportHandler(ABC):
    @property
    @abstractmethod
    def template_headers(self) -> list[str]: ...

    def example_rows(self) -> list[list[str]]:
        return []

    def generate_template(self) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(self.template_headers)
        for row in self.example_rows():
            writer.writerow(row)
        return output.getvalue()

    @abstractmethod
    def process_row(self, row: dict[str, str], db: Session) -> dict: ...


class UserImportHandler(ImportHandler):
    @property
    def template_headers(self) -> list[str]:
        return ["name", "email", "password", "is_active", "is_superuser", "roles"]

    def example_rows(self) -> list[list[str]]:
        return [
            ["John Doe", "john@example.com", "password123", "true", "false", "admin"],
            ["Jane Smith", "jane@example.com", "secure_pass", "true", "false", "admin|user"],
        ]

    def process_row(self, row: dict[str, str], db: Session) -> dict:
        email = row.get("email", "").strip()
        name = row.get("name", "").strip()
        password = row.get("password", "").strip()

        if not email:
            return {"error": "Email is required"}
        if not name:
            return {"error": "Name is required"}
        if not password:
            return {"error": "Password is required"}

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return {"error": f"Email '{email}' already exists"}

        is_active = row.get("is_active", "true").strip().lower() in ("true", "1", "yes")
        is_superuser = row.get("is_superuser", "false").strip().lower() in ("true", "1", "yes")

        user = User(
            email=email,
            name=name,
            hashed_password=hash_password(password),
            is_active=is_active,
            is_superuser=is_superuser,
        )

        roles_str = row.get("roles", "").strip()
        if roles_str:
            role_names = [r.strip() for r in roles_str.split("|") if r.strip()]
            roles = db.query(Role).filter(Role.name.in_(role_names)).all()
            found_names = {r.name for r in roles}
            for rn in role_names:
                if rn not in found_names:
                    return {"error": f"Role '{rn}' not found"}
            user.roles = roles

        db.add(user)
        db.commit()
        db.refresh(user)
        return {"created": user.id}


class RoleImportHandler(ImportHandler):
    @property
    def template_headers(self) -> list[str]:
        return ["name", "description", "permissions"]

    def example_rows(self) -> list[list[str]]:
        return [
            ["editor", "Can edit content", "read_user|update_user"],
            ["moderator", "Can moderate content", "read_user|read_role"],
        ]

    def process_row(self, row: dict[str, str], db: Session) -> dict:
        name = row.get("name", "").strip()
        if not name:
            return {"error": "Name is required"}

        existing = db.query(Role).filter(Role.name == name).first()
        if existing:
            return {"error": f"Role '{name}' already exists"}

        description = row.get("description", "").strip()
        role = Role(name=name, description=description)

        perms_str = row.get("permissions", "").strip()
        if perms_str:
            codenames = [p.strip() for p in perms_str.split("|") if p.strip()]
            permissions = db.query(Permission).filter(Permission.codename.in_(codenames)).all()
            found = {p.codename for p in permissions}
            for cn in codenames:
                if cn not in found:
                    return {"error": f"Permission '{cn}' not found"}
            role.permissions = permissions

        db.add(role)
        db.commit()
        db.refresh(role)
        return {"created": role.id}


HANDLERS: dict[str, ImportHandler] = {
    "users": UserImportHandler(),
    "roles": RoleImportHandler(),
}


def parse_csv(content: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(content))
    rows = []
    for i, row in enumerate(reader, start=2):
        cleaned = {k.strip(): v.strip() if v else "" for k, v in row.items()}
        cleaned["_line"] = i
        rows.append(cleaned)
    return rows

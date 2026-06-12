from app.auth import hash_password
from app.exceptions import ConflictException, NotFoundException
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate


class UserService:
    def __init__(self, user_repo: UserRepository, role_repo: RoleRepository):
        self.user_repo = user_repo
        self.role_repo = role_repo

    def get_all(self, skip: int = 0, limit: int = 100) -> list[User]:
        return self.user_repo.get_all(skip, limit)

    def get_by_id(self, user_id: int) -> User:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    def get_by_email(self, email: str) -> User | None:
        return self.user_repo.get_by_email(email)

    def update(self, user_id: int, data: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        if data.name is not None:
            user.name = data.name
        if data.email is not None:
            existing = self.user_repo.get_by_email(data.email)
            if existing and existing.id != user.id:
                raise ConflictException("Email already registered")
            user.email = data.email
        if data.is_active is not None:
            user.is_active = data.is_active
        if data.is_superuser is not None:
            user.is_superuser = data.is_superuser
        if data.password is not None:
            user.hashed_password = hash_password(data.password)
        return self.user_repo.save(user)

    def delete(self, user_id: int) -> None:
        user = self.get_by_id(user_id)
        self.user_repo.delete(user)

    def update_roles(self, user_id: int, role_ids: list[int]) -> User:
        user = self.get_by_id(user_id)
        roles = self.role_repo.get_all()
        selected = [r for r in roles if r.id in role_ids]
        if len(selected) != len(role_ids):
            raise NotFoundException("One or more roles not found")
        user.roles = selected
        return self.user_repo.save(user)

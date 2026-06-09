from app.auth import create_access_token, hash_password, verify_password
from app.exceptions import ConflictException, UnauthorizedException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    def register(self, data: UserCreate) -> User:
        existing = self.repo.get_by_email(data.email)
        if existing:
            raise ConflictException("Email already registered")
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            name=data.name,
        )
        return self.repo.create(user)

    def login(self, data: LoginRequest) -> str:
        user = self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
        return create_access_token({"sub": user.email})

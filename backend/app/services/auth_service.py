from app.auth import create_access_token, hash_password, verify_password
from app.exceptions import ConflictException, UnauthorizedException
from app.models.company import Company
from app.models.user import User
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, user_repo: UserRepository, company_repo: CompanyRepository):
        self.user_repo = user_repo
        self.company_repo = company_repo

    def register(self, data: UserCreate) -> User:
        existing = self.user_repo.get_by_email(data.email)
        if existing:
            raise ConflictException("Email already registered")
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            name=data.name,
            company_id=data.company_id,
        )
        return self.user_repo.create(user)

    def register_company(self, company_name: str, user_data: UserCreate) -> User:
        existing_user = self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise ConflictException("Email already registered")

        company = Company(name=company_name)
        company = self.company_repo.create(company)

        user = User(
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            name=user_data.name,
            is_superuser=True,
            company_id=company.id,
        )
        user = self.user_repo.create(user)
        return user

    def login(self, data: LoginRequest) -> str:
        user = self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
        return create_access_token({"sub": user.email})

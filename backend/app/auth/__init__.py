from datetime import datetime, timedelta, timezone

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.exceptions import ForbiddenException, UnauthorizedException
from app.models.user import User
from app.repositories.role_repository import PermissionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import TokenData

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> TokenData | None:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        email: str | None = payload.get("sub")
        if email is None:
            return None
        return TokenData(email=email)
    except JWTError:
        return None


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    token_data = verify_token(token)
    if token_data is None or token_data.email is None:
        raise UnauthorizedException("Invalid or expired token")
    repo = UserRepository(db)
    user = repo.get_by_email(token_data.email)
    if user is None:
        raise UnauthorizedException("User not found")
    return user


def require_permission(codename: str):
    def checker(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if user.is_superuser:
            return user
        perm_repo = PermissionRepository(db)
        perm = perm_repo.get_by_codename(codename)
        if perm is None:
            raise ForbiddenException("Permission not found")
        for role in user.roles:
            if perm in role.permissions:
                return user
        raise ForbiddenException("Not enough permissions")

    return checker

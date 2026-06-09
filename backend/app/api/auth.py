from fastapi import APIRouter, Depends, status

from app.auth import get_current_user
from app.dependencies import get_user_repo
from app.schemas.auth import LoginRequest
from app.schemas.user import Token, UserCreate, UserWithRoles
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserWithRoles, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, repo=Depends(get_user_repo)):
    service = AuthService(repo)
    return service.register(user_data)


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, repo=Depends(get_user_repo)):
    service = AuthService(repo)
    token = service.login(login_data)
    return Token(access_token=token)

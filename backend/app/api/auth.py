from fastapi import APIRouter, Depends, status

from app.dependencies import get_auth_service
from app.schemas.auth import LoginRequest
from app.schemas.user import Token, UserCreate, UserWithRoles
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserWithRoles, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, service: AuthService = Depends(get_auth_service)):
    return service.register(user_data)


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    token = service.login(login_data)
    return Token(access_token=token)

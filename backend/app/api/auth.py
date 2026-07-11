from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr

from app.dependencies import get_auth_service
from app.schemas.auth import LoginRequest
from app.schemas.user import Token, UserCreate, UserWithRoles
from app.services.auth_service import AuthService

router = APIRouter()


class RegisterCompanyRequest(BaseModel):
    company_name: str
    email: EmailStr
    password: str
    name: str


@router.post("/register", response_model=UserWithRoles, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, service: AuthService = Depends(get_auth_service)):
    return service.register(user_data)


@router.post("/register-company", response_model=UserWithRoles, status_code=status.HTTP_201_CREATED)
def register_company(
    data: RegisterCompanyRequest,
    service: AuthService = Depends(get_auth_service),
):
    user_data = UserCreate(
        email=data.email,
        password=data.password,
        name=data.name,
    )
    return service.register_company(data.company_name, user_data)


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    token = service.login(login_data)
    return Token(access_token=token)

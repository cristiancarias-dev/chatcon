from fastapi import APIRouter, Depends, status

from app.auth import get_current_user, require_permission
from app.dependencies import get_company_service
from app.models.user import User
from app.schemas.company import CompanyRead, CompanyUpdate
from app.services.company_service import CompanyService

router = APIRouter()


@router.get("/me", response_model=CompanyRead)
def get_my_company(
    current_user: User = Depends(get_current_user),
    service: CompanyService = Depends(get_company_service),
):
    if not current_user.company_id:
        from app.exceptions import NotFoundException
        raise NotFoundException("No company associated with this user")
    return service.get_by_id(current_user.company_id)


@router.put("/me", response_model=CompanyRead)
def update_my_company(
    data: CompanyUpdate,
    current_user: User = Depends(require_permission("update_company")),
    service: CompanyService = Depends(get_company_service),
):
    if not current_user.company_id:
        from app.exceptions import NotFoundException
        raise NotFoundException("No company associated with this user")
    return service.update(current_user.company_id, data)

from fastapi import APIRouter, Depends

from app.auth import get_current_user, require_permission
from app.dependencies import get_permission_repo
from app.models.user import User
from app.schemas.role import PermissionRead

router = APIRouter()


@router.get("/", response_model=list[PermissionRead])
def list_permissions(
    repo=Depends(get_permission_repo),
    _: User = Depends(require_permission("read_role")),
):
    return repo.get_all()

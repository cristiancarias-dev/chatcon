from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models.role import Permission
from app.models.user import User
from app.schemas.role import PermissionRead

router = APIRouter()


@router.get("/", response_model=list[PermissionRead])
def list_permissions(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("read_role")),
):
    return db.query(Permission).order_by(Permission.codename).all()

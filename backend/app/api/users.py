from fastapi import APIRouter, Depends, status

from app.auth import get_current_user, require_permission
from app.dependencies import get_user_service
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate, UserWithRoles
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserWithRoles)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserRead)
def update_current_user(
    user_data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    return service.update(current_user.id, user_data)


@router.get("/", response_model=list[UserWithRoles])
def list_users(
    skip: int = 0,
    limit: int = 100,
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_permission("read_user")),
):
    return service.get_all(skip, limit)


@router.get("/{user_id}", response_model=UserWithRoles)
def read_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_permission("read_user")),
):
    return service.get_by_id(user_id)


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_permission("update_user")),
):
    return service.update(user_id, user_data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_permission("delete_user")),
):
    service.delete(user_id)


@router.put("/{user_id}/roles", response_model=UserWithRoles)
def update_user_roles(
    user_id: int,
    role_ids: list[int],
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_permission("update_user")),
):
    return service.update_roles(user_id, role_ids)

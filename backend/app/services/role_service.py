from app.exceptions import ConflictException, NotFoundException
from app.models.role import Role
from app.repositories.role_repository import PermissionRepository, RoleRepository
from app.schemas.role import RoleCreate, RoleUpdate


class RoleService:
    def __init__(self, role_repo: RoleRepository, perm_repo: PermissionRepository | None = None):
        self.role_repo = role_repo
        self.perm_repo = perm_repo or PermissionRepository(role_repo.db)

    def get_all(self) -> list[Role]:
        return self.role_repo.get_all()

    def get_by_id(self, role_id: int) -> Role:
        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise NotFoundException("Role not found")
        return role

    def create(self, data: RoleCreate) -> Role:
        existing = self.role_repo.get_by_name(data.name)
        if existing:
            raise ConflictException("Role already exists")
        role = Role(name=data.name, description=data.description)
        return self.role_repo.create(role)

    def update(self, role_id: int, data: RoleUpdate) -> Role:
        role = self.get_by_id(role_id)
        if data.name is not None:
            existing = self.role_repo.get_by_name(data.name)
            if existing and existing.id != role.id:
                raise ConflictException("Role name already exists")
            role.name = data.name
        if data.description is not None:
            role.description = data.description
        return self.role_repo.save(role)

    def delete(self, role_id: int) -> None:
        role = self.get_by_id(role_id)
        self.role_repo.delete(role)

    def update_permissions(self, role_id: int, permission_ids: list[int]) -> Role:
        role = self.get_by_id(role_id)
        permissions = self.perm_repo.get_by_ids(permission_ids)
        if len(permissions) != len(permission_ids):
            raise NotFoundException("One or more permissions not found")
        role.permissions = permissions
        return self.role_repo.save(role)

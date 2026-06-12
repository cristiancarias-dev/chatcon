from datetime import UTC, datetime

from app.auth.authorization import is_admin
from app.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.contact import Contact
from app.models.user import User
from app.repositories.contact_repository import ContactRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.contact import ContactCreate, ContactUpdate


class ContactService:
    def __init__(
        self,
        contact_repo: ContactRepository,
        user_repo: UserRepository,
        role_repo: RoleRepository,
    ):
        self.contact_repo = contact_repo
        self.user_repo = user_repo
        self.role_repo = role_repo

    def get_all(
        self,
        current_user: User,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
    ) -> list[Contact]:
        if is_admin(current_user):
            return self.contact_repo.get_all(skip, limit, search=search)
        return self.contact_repo.get_all(
            skip, limit, agent_id=current_user.id, search=search
        )

    def count_all(self, current_user: User, search: str | None = None) -> int:
        if is_admin(current_user):
            return self.contact_repo.count_all(search=search)
        return self.contact_repo.count_all(agent_id=current_user.id, search=search)

    def get_by_id(self, contact_id: int, current_user: User) -> Contact:
        contact = self.contact_repo.get_by_id(contact_id)
        if not contact:
            raise NotFoundException("Contact not found")
        is_not_owner = contact.assigned_agent_id != current_user.id
        if not is_admin(current_user) and is_not_owner:
            raise ForbiddenException("You can only view your own contacts")
        return contact

    def create(self, data: ContactCreate) -> Contact:
        existing = self.contact_repo.get_by_phone(data.phone)
        if existing:
            raise ConflictException("A contact with this phone already exists")
        contact = Contact(
            name=data.name,
            phone=data.phone,
            email=data.email,
            notes=data.notes or "",
            assigned_agent_id=data.assigned_agent_id,
        )
        if data.assigned_agent_id is not None:
            contact.assigned_at = datetime.now(UTC)
        return self.contact_repo.create(contact)

    def create_from_whatsapp(self, phone: str, name: str | None = None) -> Contact:
        existing = self.contact_repo.get_by_phone(phone)
        if existing:
            return existing
        contact = Contact(
            name=name or phone,
            phone=phone,
        )
        return self.contact_repo.create(contact)

    def update(
        self, contact_id: int, data: ContactUpdate, current_user: User
    ) -> Contact:
        contact = self.get_by_id(contact_id, current_user)
        if data.name is not None:
            contact.name = data.name
        if data.phone is not None:
            existing = self.contact_repo.get_by_phone(data.phone)
            if existing and existing.id != contact.id:
                raise ConflictException("A contact with this phone already exists")
            contact.phone = data.phone
        if data.email is not None:
            contact.email = data.email
        if data.notes is not None:
            contact.notes = data.notes
        if data.avatar_url is not None:
            contact.avatar_url = data.avatar_url
        if data.is_active is not None:
            contact.is_active = data.is_active
        if data.assigned_agent_id is not None:
            contact.assigned_agent_id = data.assigned_agent_id
            contact.assigned_at = datetime.now(UTC)
        return self.contact_repo.save(contact)

    def delete(self, contact_id: int, current_user: User) -> None:
        contact = self.get_by_id(contact_id, current_user)
        contact.is_active = False
        self.contact_repo.save(contact)

    def assign_agent(
        self, contact_id: int, agent_id: int | None, current_user: User
    ) -> Contact:
        if not is_admin(current_user):
            raise ForbiddenException("Only admins can assign agents")
        contact = self.contact_repo.get_by_id(contact_id)
        if not contact:
            raise NotFoundException("Contact not found")
        if agent_id is not None:
            agent = self.user_repo.get_by_id(agent_id)
            if not agent:
                raise NotFoundException("Agent not found")
            contact.assigned_agent_id = agent_id
            contact.assigned_at = datetime.now(UTC)
        else:
            contact.assigned_agent_id = None
            contact.assigned_at = None
        return self.contact_repo.save(contact)

    def get_assignable_agents(self) -> list[User]:
        agent_role = self.role_repo.get_by_name("agent")
        if not agent_role:
            return []
        return [u for u in agent_role.users if u.is_active]

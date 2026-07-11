from fastapi import APIRouter, Depends, Query, status

from app.auth import require_permission
from app.dependencies import get_contact_service
from app.models.user import User
from app.schemas.contact import ContactAssign, ContactCreate, ContactRead, ContactUpdate
from app.services.contact_service import ContactService

router = APIRouter()


@router.get("/", response_model=list[ContactRead])
def list_contacts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: str | None = Query(None),
    current_user: User = Depends(require_permission("read_contact")),
    service: ContactService = Depends(get_contact_service),
):
    return service.get_all(current_user, skip, limit, search)


@router.get("/count")
def count_contacts(
    search: str | None = Query(None),
    current_user: User = Depends(require_permission("read_contact")),
    service: ContactService = Depends(get_contact_service),
):
    return {"count": service.count_all(current_user, search)}


@router.post("/", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
def create_contact(
    data: ContactCreate,
    current_user: User = Depends(require_permission("create_contact")),
    service: ContactService = Depends(get_contact_service),
):
    return service.create(data, current_user)


@router.get("/{contact_id}", response_model=ContactRead)
def read_contact(
    contact_id: int,
    current_user: User = Depends(require_permission("read_contact")),
    service: ContactService = Depends(get_contact_service),
):
    return service.get_by_id(contact_id, current_user)


@router.put("/{contact_id}", response_model=ContactRead)
def update_contact(
    contact_id: int,
    data: ContactUpdate,
    current_user: User = Depends(require_permission("update_contact")),
    service: ContactService = Depends(get_contact_service),
):
    return service.update(contact_id, data, current_user)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    current_user: User = Depends(require_permission("delete_contact")),
    service: ContactService = Depends(get_contact_service),
):
    service.delete(contact_id, current_user)


@router.put("/{contact_id}/assign", response_model=ContactRead)
def assign_agent(
    contact_id: int,
    data: ContactAssign,
    current_user: User = Depends(require_permission("update_contact")),
    service: ContactService = Depends(get_contact_service),
):
    return service.assign_agent(contact_id, data.agent_id, current_user)


@router.get("/assignable-agents/list")
def list_assignable_agents(
    _: User = Depends(require_permission("read_contact")),
    service: ContactService = Depends(get_contact_service),
):
    agents = service.get_assignable_agents()
    return [{"id": a.id, "name": a.name, "email": a.email} for a in agents]

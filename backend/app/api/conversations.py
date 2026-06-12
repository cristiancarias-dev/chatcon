from fastapi import APIRouter, Depends, Query, status

from app.auth import require_permission
from app.dependencies import get_conversation_service
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationStatusUpdate,
    ConversationUpdate,
    MessageCreate,
)
from app.services.conversation_service import ConversationService

router = APIRouter()


@router.get("/")
def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
    search: str | None = Query(None),
    current_user: User = Depends(require_permission("read_conversation")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.get_all(current_user, skip, limit, status, search)


@router.get("/count")
def count_conversations(
    status: str | None = Query(None),
    search: str | None = Query(None),
    current_user: User = Depends(require_permission("read_conversation")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.count_all(current_user, status, search)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(require_permission("create_conversation")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.create(data, current_user)


@router.get("/{conversation_id}")
def read_conversation(
    conversation_id: int,
    current_user: User = Depends(require_permission("read_conversation")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.get_by_id(conversation_id, current_user)


@router.patch("/{conversation_id}/status")
def update_conversation_status(
    conversation_id: int,
    data: ConversationStatusUpdate,
    current_user: User = Depends(require_permission("update_conversation")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.update_status(conversation_id, data.status, current_user)


@router.patch("/{conversation_id}")
def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    current_user: User = Depends(require_permission("update_conversation")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.update(conversation_id, data, current_user)


@router.get("/{conversation_id}/messages")
def list_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_permission("read_conversation")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.get_messages(conversation_id, current_user, skip, limit)


@router.post("/{conversation_id}/messages", status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: int,
    data: MessageCreate,
    current_user: User = Depends(require_permission("send_message")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.send_message(conversation_id, data, current_user)


@router.post("/{conversation_id}/read")
def mark_as_read(
    conversation_id: int,
    current_user: User = Depends(require_permission("read_conversation")),
    service: ConversationService = Depends(get_conversation_service),
):
    return service.mark_read(conversation_id, current_user)

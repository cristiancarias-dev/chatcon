from datetime import datetime

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    contact_id: int
    assigned_agent_id: int | None = None
    whatsapp_account_id: int | None = None


class ConversationStatusUpdate(BaseModel):
    status: str


class ConversationUpdate(BaseModel):
    whatsapp_account_id: int | None = None


class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"
    template_name: str | None = None
    template_params: list[str] | None = None


class MessageRead(BaseModel):
    id: int
    conversation_id: int
    sender_type: str
    content: str
    message_type: str
    template_name: str | None
    template_params: list[str] | None = None
    is_read: bool
    whatsapp_status: str | None = None
    whatsapp_message_id: str | None = None
    whatsapp_error_code: int | None = None
    whatsapp_error_message: str | None = None
    created_at: datetime
    model_config = {"from_attributes": True}


class ConversationRead(BaseModel):
    id: int
    contact_id: int
    contact_name: str | None = None
    contact_phone: str | None = None
    assigned_agent_id: int | None
    whatsapp_account_id: int | None = None
    status: str
    message_count: int = 0
    unread_count: int = 0
    last_message: str | None = None
    last_message_at: datetime | None = None
    last_incoming_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ConversationDetail(BaseModel):
    id: int
    contact_id: int
    contact_name: str
    contact_phone: str
    assigned_agent_id: int | None
    whatsapp_account_id: int | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

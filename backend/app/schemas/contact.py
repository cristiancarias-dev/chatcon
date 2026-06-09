from datetime import datetime

from pydantic import BaseModel


class AgentRef(BaseModel):
    id: int
    name: str
    email: str
    model_config = {"from_attributes": True}


class ContactCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    notes: str | None = None
    assigned_agent_id: int | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None
    avatar_url: str | None = None
    is_active: bool | None = None
    assigned_agent_id: int | None = None


class ContactRead(BaseModel):
    id: int
    name: str
    phone: str
    email: str | None
    notes: str | None
    avatar_url: str | None
    is_active: bool
    assigned_agent_id: int | None
    assigned_at: datetime | None
    last_contacted_at: datetime | None
    created_at: datetime
    updated_at: datetime
    assigned_agent: AgentRef | None
    model_config = {"from_attributes": True}


class ContactAssign(BaseModel):
    agent_id: int | None = None

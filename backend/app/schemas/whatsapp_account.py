from datetime import datetime

from pydantic import BaseModel


class WhatsAppAccountCreate(BaseModel):
    name: str
    phone_number_id: str
    phone_number: str
    business_account_id: str | None = None
    access_token: str
    api_version: str = "v22.0"
    is_active: bool = True
    default_template_name: str | None = None


class WhatsAppAccountUpdate(BaseModel):
    name: str | None = None
    phone_number_id: str | None = None
    phone_number: str | None = None
    business_account_id: str | None = None
    access_token: str | None = None
    api_version: str | None = None
    is_active: bool | None = None
    default_template_name: str | None = None


class WhatsAppAccountRead(BaseModel):
    id: int
    name: str
    phone_number_id: str
    phone_number: str
    business_account_id: str | None = None
    default_template_name: str | None = None
    access_token_preview: str = ""
    api_version: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

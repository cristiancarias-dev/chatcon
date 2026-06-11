from datetime import datetime

from pydantic import BaseModel


class WhatsAppTemplateCreate(BaseModel):
    name: str
    language: str = "en_US"
    category: str = "MARKETING"
    components: list[dict] = []


class WhatsAppTemplateRead(BaseModel):
    id: int
    account_id: int
    name: str
    language: str
    category: str
    status: str
    meta_template_id: str | None = None
    components: str | None = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

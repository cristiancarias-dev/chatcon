from datetime import datetime
from typing import Literal

from pydantic import BaseModel

VALID_CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"]

VALID_LANGUAGES = [
    "en_US", "en", "en_GB", "es", "es_MX", "es_AR", "pt_BR", "pt", "fr", "fr_CA",
    "de", "it", "nl", "ja", "ko", "zh_CN", "zh_TW", "zh_HK", "ar", "he", "hi",
    "bn", "ta", "te", "ml", "kn", "mr", "gu", "pa", "ur", "fa", "tr", "ru", "uk",
    "pl", "cs", "sk", "hu", "ro", "bg", "hr", "sl", "sr", "el", "th", "vi", "id",
    "ms", "fil", "sw", "am", "nb", "da", "sv", "fi", "lv", "lt", "et", "ca", "eu", "gl",
]


class WhatsAppTemplateCreate(BaseModel):
    name: str
    language: str = "en_US"
    category: Literal["MARKETING", "UTILITY", "AUTHENTICATION"] = "MARKETING"
    components: list[dict] = []
    allow_category_change: bool = True


class WhatsAppTemplateUpdate(BaseModel):
    language: str = "en_US"
    category: Literal["MARKETING", "UTILITY", "AUTHENTICATION"] = "MARKETING"
    components: list[dict] = []
    allow_category_change: bool = True


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

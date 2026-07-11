from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class WhatsAppAccount(Base):
    __tablename__ = "whatsapp_accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone_number_id = Column(String(100), nullable=False)
    phone_number = Column(String(50), nullable=False)
    business_account_id = Column(String(100), nullable=True)
    access_token_encrypted = Column(Text, nullable=False)
    api_version = Column(String(10), default="v22.0")
    is_active = Column(Boolean, default=True)
    default_template_name = Column(String(100), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    company = relationship("Company", backref="whatsapp_accounts")

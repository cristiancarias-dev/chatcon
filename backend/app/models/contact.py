from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=True)
    notes = Column(Text, default="")
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    assigned_agent_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    last_contacted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    assigned_agent = relationship("User", backref="assigned_contacts")
    company = relationship("Company", backref="contacts")

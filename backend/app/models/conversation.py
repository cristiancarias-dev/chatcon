from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(
        Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assigned_agent_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    whatsapp_account_id = Column(
        Integer, ForeignKey("whatsapp_accounts.id", ondelete="SET NULL"), nullable=True
    )
    status = Column(String(20), default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    contact = relationship("Contact", backref="conversations")
    assigned_agent = relationship("User", backref="assigned_conversations")
    whatsapp_account = relationship("WhatsAppAccount", backref="conversations")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(
        Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_type = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")
    template_name = Column(String(100), nullable=True)
    template_params = Column(Text, nullable=True)
    whatsapp_message_id = Column(String(255), nullable=True, index=True)
    whatsapp_status = Column(String(20), nullable=True)
    whatsapp_error_code = Column(Integer, nullable=True)
    whatsapp_error_message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", backref="messages")

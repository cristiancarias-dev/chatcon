from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.conversation import Conversation, Message
from app.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self, db: Session):
        super().__init__(db, Conversation)

    def get_by_contact(self, contact_id: int) -> Conversation | None:
        return self._db.query(Conversation).filter(Conversation.contact_id == contact_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        agent_id: int | None = None,
        status: str | None = None,
        search: str | None = None,
    ) -> list[Conversation]:
        q = self._db.query(Conversation)
        if agent_id is not None:
            q = q.filter(Conversation.assigned_agent_id == agent_id)
        if status is not None:
            q = q.filter(Conversation.status == status)
        if search:
            q = q.join(Contact).filter(
                Contact.name.ilike(f"%{search}%") | Contact.phone.ilike(f"%{search}%")
            )
        return q.order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()

    def count_all(
        self,
        agent_id: int | None = None,
        status: str | None = None,
        search: str | None = None,
    ) -> int:
        q = self._db.query(func.count(Conversation.id))
        if agent_id is not None:
            q = q.filter(Conversation.assigned_agent_id == agent_id)
        if status is not None:
            q = q.filter(Conversation.status == status)
        if search:
            q = q.join(Contact).filter(
                Contact.name.ilike(f"%{search}%") | Contact.phone.ilike(f"%{search}%")
            )
        return q.scalar()

    def get_contact_by_id(self, contact_id: int) -> Contact | None:
        return self._db.query(Contact).filter(Contact.id == contact_id).first()


class MessageRepository(BaseRepository[Message]):
    def __init__(self, db: Session):
        super().__init__(db, Message)

    def get_by_conversation(
        self, conversation_id: int, skip: int = 0, limit: int = 100
    ) -> list[Message]:
        return (
            self._db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_last_message(self, conversation_id: int) -> Message | None:
        return (
            self._db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .first()
        )

    def mark_as_read(self, message_id: int) -> Message | None:
        msg = self._db.query(Message).filter(Message.id == message_id).first()
        if msg:
            msg.is_read = True
            self._db.commit()
            self._db.refresh(msg)
        return msg

    def get_by_whatsapp_message_id(self, wa_msg_id: str) -> list[Message]:
        return (
            self._db.query(Message)
            .filter(Message.whatsapp_message_id == wa_msg_id)
            .all()
        )

    def mark_all_as_read(self, conversation_id: int) -> int:
        return (
            self._db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.is_read == False,
                Message.sender_type == "contact",
            )
            .update({"is_read": True})
        )

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, Message
from app.models.contact import Contact


class ConversationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, conversation_id: int) -> Conversation | None:
        return self.db.query(Conversation).filter(Conversation.id == conversation_id).first()

    def get_by_contact(self, contact_id: int) -> Conversation | None:
        return self.db.query(Conversation).filter(Conversation.contact_id == contact_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        agent_id: int | None = None,
        status: str | None = None,
        search: str | None = None,
    ) -> list[Conversation]:
        q = self.db.query(Conversation)
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
        q = self.db.query(func.count(Conversation.id))
        if agent_id is not None:
            q = q.filter(Conversation.assigned_agent_id == agent_id)
        if status is not None:
            q = q.filter(Conversation.status == status)
        if search:
            q = q.join(Contact).filter(
                Contact.name.ilike(f"%{search}%") | Contact.phone.ilike(f"%{search}%")
            )
        return q.scalar()

    def get_message_count(self, conversation_id: int) -> int:
        return (
            self.db.query(func.count(Message.id))
            .filter(Message.conversation_id == conversation_id)
            .scalar()
        )

    def get_unread_count(self, conversation_id: int) -> int:
        return (
            self.db.query(func.count(Message.id))
            .filter(
                Message.conversation_id == conversation_id,
                Message.is_read == False,
                Message.sender_type == "contact",
            )
            .scalar()
        )

    def create(self, conversation: Conversation) -> Conversation:
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def save(self, conversation: Conversation) -> Conversation:
        self.db.commit()
        self.db.refresh(conversation)
        return conversation


class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_conversation(
        self, conversation_id: int, skip: int = 0, limit: int = 100
    ) -> list[Message]:
        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_last_message(self, conversation_id: int) -> Message | None:
        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .first()
        )

    def create(self, message: Message) -> Message:
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def mark_as_read(self, message_id: int) -> Message | None:
        msg = self.db.query(Message).filter(Message.id == message_id).first()
        if msg:
            msg.is_read = True
            self.db.commit()
            self.db.refresh(msg)
        return msg

    def mark_all_as_read(self, conversation_id: int) -> int:
        return (
            self.db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.is_read == False,
                Message.sender_type == "contact",
            )
            .update({"is_read": True})
        )

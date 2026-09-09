from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from .database import Base


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)

    pinned = Column(Boolean, default=False, nullable=False)

    reminder_enabled = Column(Boolean, default=False, nullable=False)

    reminder_date = Column(String(20), nullable=True)
    reminder_time = Column(String(20), nullable=True)

    repeat = Column(String(20), default="none", nullable=False)

    created_at = Column(DateTime, nullable=False)
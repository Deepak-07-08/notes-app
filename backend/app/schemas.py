from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NoteBase(BaseModel):
    title: str
    content: str
    pinned: bool = False
    reminder_enabled: bool = False
    reminder_date: Optional[str] = None
    reminder_time: Optional[str] = None
    repeat: str = "none"


class NoteCreate(NoteBase):
    pass


class NoteUpdate(NoteBase):
    pass


class NoteResponse(NoteBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
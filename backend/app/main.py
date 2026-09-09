from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from . import models
from .schemas import NoteCreate, NoteResponse, NoteUpdate


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notes App API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://my-notessapp.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Notes API is running"}


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception as e:
        return {
            "status": "error",
            "database": "not connected",
            "detail": str(e),
        }


# GET NOTES FOR ONE USER
@app.get("/notes", response_model=list[NoteResponse])
def get_notes(
    user_id: str,
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Note)
        .filter(models.Note.user_id == user_id)
        .order_by(
            models.Note.pinned.desc(),
            models.Note.created_at.desc(),
        )
        .all()
    )


# CREATE NOTE
@app.post("/notes", response_model=NoteResponse)
def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db),
):
    new_note = models.Note(
        user_id=note.user_id,
        title=note.title,
        content=note.content,
        pinned=note.pinned,
        reminder_enabled=note.reminder_enabled,
        reminder_date=note.reminder_date,
        reminder_time=note.reminder_time,
        repeat=note.repeat,
        created_at=datetime.utcnow(),
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note


# UPDATE NOTE
@app.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note: NoteUpdate,
    db: Session = Depends(get_db),
):
    existing_note = (
        db.query(models.Note)
        .filter(
            models.Note.id == note_id,
            models.Note.user_id == note.user_id,
        )
        .first()
    )

    if not existing_note:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    existing_note.title = note.title
    existing_note.content = note.content
    existing_note.pinned = note.pinned
    existing_note.reminder_enabled = note.reminder_enabled
    existing_note.reminder_date = note.reminder_date
    existing_note.reminder_time = note.reminder_time
    existing_note.repeat = note.repeat

    db.commit()
    db.refresh(existing_note)

    return existing_note


# DELETE NOTE
@app.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    user_id: str,
    db: Session = Depends(get_db),
):
    existing_note = (
        db.query(models.Note)
        .filter(
            models.Note.id == note_id,
            models.Note.user_id == user_id,
        )
        .first()
    )

    if not existing_note:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    db.delete(existing_note)
    db.commit()

    return {"message": "Note deleted successfully"}
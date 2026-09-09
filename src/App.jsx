import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "https://notes-app-taxg.onrender.com";
const REPEAT_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getToday() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatTime(time) {
  if (!time) return "";

  const [hour, minute] = time.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")} ${period}`;
}

function CalendarPicker({ value, onChange, onClose }) {
  const initialDate = value
    ? new Date(`${value}T00:00:00`)
    : new Date();

  const [month, setMonth] = useState(initialDate.getMonth());
  const [year, setYear] = useState(initialDate.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = new Date(year, month).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const previousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const chooseDay = (day) => {
    const selected = `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    onChange(selected);
    onClose();
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" onClick={previousMonth}>
          ‹
        </button>

        <strong>{monthName}</strong>

        <button type="button" onClick={nextMonth}>
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={index}>{day}</span>
        ))}
      </div>

      <div className="calendar-days">
        {Array.from({ length: firstDay }).map((_, index) => (
          <button key={`empty-${index}`} disabled />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;

          const dateString = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;

          return (
            <button
              type="button"
              key={day}
              className={
                dateString === value ? "selected-day" : ""
              }
              onClick={() => chooseDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimePicker({ value, onChange }) {
  const [hour, minute] = value
    ? value.split(":").map(Number)
    : [12, 0];

  const period = hour >= 12 ? "PM" : "AM";

  const displayHour = hour % 12 || 12;

  const updateTime = (newHour, newMinute, newPeriod) => {
    let h = Number(newHour);
    const m = Number(newMinute);

    if (newPeriod === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }

    onChange(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
  };

  return (
    <div className="time-picker">
      <select
        value={displayHour}
        onChange={(e) =>
          updateTime(e.target.value, minute, period)
        }
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, "0")}
          </option>
        ))}
      </select>

      <span>:</span>

      <select
        value={minute}
        onChange={(e) =>
          updateTime(displayHour, e.target.value, period)
        }
      >
        {Array.from({ length: 60 }, (_, i) => i).map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>

      <div className="ampm">
        <button
          type="button"
          className={period === "AM" ? "active" : ""}
          onClick={() =>
            updateTime(displayHour, minute, "AM")
          }
        >
          AM
        </button>

        <button
          type="button"
          className={period === "PM" ? "active" : ""}
          onClick={() =>
            updateTime(displayHour, minute, "PM")
          }
        >
          PM
        </button>
      </div>
    </div>
  );
}

function App() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [calendarOpen, setCalendarOpen] = useState(false);

  const titleRef = useRef(null);

  const emptyForm = {
    title: "",
    content: "",
    pinned: false,
    reminder_enabled: false,
    reminder_date: getToday(),
    reminder_time: "12:00",
    repeat: "none",
  };

  const [form, setForm] = useState(emptyForm);

  // LOAD NOTES
  useEffect(() => {
    fetch(`${API_URL}/notes`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load notes");
        }

        return response.json();
      })
      .then((data) => {
        setNotes(data);
      })
      .catch((error) => {
        console.error("Error loading notes:", error);
      });
  }, []);

  // NEW NOTE
  const openNewNote = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      reminder_date: getToday(),
    });
    setCalendarOpen(false);
    setShowModal(true);

    setTimeout(() => {
      titleRef.current?.focus();
    }, 100);
  };

  // EDIT NOTE
  const openEditNote = (note) => {
    setEditingId(note.id);

    setForm({
      title: note.title || "",
      content: note.content || "",
      pinned: note.pinned || false,
      reminder_enabled: note.reminder_enabled || false,
      reminder_date: note.reminder_date || getToday(),
      reminder_time: note.reminder_time || "12:00",
      repeat: note.repeat || "none",
    });

    setCalendarOpen(false);
    setShowModal(true);

    setTimeout(() => {
      titleRef.current?.focus();
    }, 100);
  };

  // CLOSE MODAL
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setCalendarOpen(false);
  };

  // SAVE NOTE
  const saveNote = async () => {
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title && !content) {
      alert("Please enter a title or content.");
      return;
    }

    const noteData = {
      ...form,
      title: title || "Untitled Note",
      content,
      reminder_date: form.reminder_enabled
        ? form.reminder_date
        : null,
      reminder_time: form.reminder_enabled
        ? form.reminder_time
        : null,
    };

    try {
      if (editingId) {
        const response = await fetch(
          `${API_URL}/notes/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(noteData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update note");
        }

        const updatedNote = await response.json();

        setNotes((previous) =>
          previous.map((note) =>
            note.id === editingId ? updatedNote : note
          )
        );
      } else {
        const response = await fetch(`${API_URL}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(noteData),
        });

        if (!response.ok) {
          throw new Error("Failed to create note");
        }

        const newNote = await response.json();

        setNotes((previous) => [newNote, ...previous]);
      }

      closeModal();
    } catch (error) {
      console.error(error);
      alert("Could not save the note.");
    }
  };

  // DELETE NOTE
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(
        `${API_URL}/notes/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes((previous) =>
        previous.filter((note) => note.id !== deleteId)
      );

      setDeleteId(null);
    } catch (error) {
      console.error(error);
      alert("Could not delete the note.");
    }
  };

  // PIN / UNPIN
  const togglePin = async (note) => {
    try {
      const updatedData = {
        title: note.title,
        content: note.content,
        pinned: !note.pinned,
        reminder_enabled: note.reminder_enabled,
        reminder_date: note.reminder_date,
        reminder_time: note.reminder_time,
        repeat: note.repeat,
      };

      const response = await fetch(
        `${API_URL}/notes/${note.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update pin");
      }

      const updatedNote = await response.json();

      setNotes((previous) =>
        previous.map((item) =>
          item.id === note.id ? updatedNote : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Could not update the note.");
    }
  };

  const filteredNotes = notes
    .filter((note) => {
      const text = `${note.title || ""} ${
        note.content || ""
      }`.toLowerCase();

      return text.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return Number(b.pinned) - Number(a.pinned);
      }

      return (
        new Date(b.created_at) -
        new Date(a.created_at)
      );
    });

  return (
    <div>
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">📝</span>
          <h1>NOTESSS</h1>
        </div>

        <div className="header-right">
          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="new-note-btn"
            onClick={openNewNote}
          >
            + New Note
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        <div className="section-title">
          <h2>Your Notes</h2>
          <span>{filteredNotes.length} notes</span>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>

            <h3>
              {search
                ? "No notes found"
                : "No notes yet"}
            </h3>

            <p>
              {search
                ? "Try a different search."
                : "Create your first note to get started."}
            </p>

            {!search && (
              <button
                className="new-note-btn empty-button"
                onClick={openNewNote}
              >
                + Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <article
                className="note-card"
                key={note.id}
              >
                <div className="note-card-header">
                  <h3>
                    {note.title || "Untitled Note"}
                  </h3>

                  <button
                    className="pin-btn"
                    onClick={() => togglePin(note)}
                    title={
                      note.pinned
                        ? "Unpin"
                        : "Pin"
                    }
                  >
                    {note.pinned ? "📌" : "📍"}
                  </button>
                </div>

                <div className="note-content">
                  {note.content}
                </div>

                {note.reminder_enabled && (
                  <div className="reminder-info">
                    <span>🔔</span>

                    <div>
                      <strong>
                        {formatDate(
                          note.reminder_date
                        )}
                      </strong>

                      <span>
                        {formatTime(
                          note.reminder_time
                        )}

                        {note.repeat !== "none" &&
                          ` • ${
                            REPEAT_OPTIONS.find(
                              (item) =>
                                item.value ===
                                note.repeat
                            )?.label || ""
                          }`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="note-footer">
                  <span className="note-date">
                    {note.created_at
                      ? new Date(
                          note.created_at
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : ""}
                  </span>

                  <div className="note-actions">
                    <button
                      onClick={() =>
                        openEditNote(note)
                      }
                      title="Edit"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() =>
                        setDeleteId(note.id)
                      }
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Note"
                    : "Create New Note"}
                </h2>

                <p>
                  {editingId
                    ? "Update your note"
                    : "Write down your thoughts"}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label className="field-label">
                Title
              </label>

              <input
                ref={titleRef}
                className="title-input"
                type="text"
                placeholder="Note title..."
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />

              <label className="field-label content-label">
                Content
              </label>

              <textarea
                className="content-input"
                placeholder="Write your note here..."
                value={form.content}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content: e.target.value,
                  })
                }
              />

              {/* REMINDER */}
              <div className="reminder-section">
                <div className="reminder-top">
                  <div className="reminder-title">
                    <span className="bell">🔔</span>

                    <div>
                      <strong>Reminder</strong>
                      <small>
                        Get reminded about this note
                      </small>
                    </div>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={form.reminder_enabled}
                      onChange={(e) => {
                        const enabled =
                          e.target.checked;

                        setForm({
                          ...form,
                          reminder_enabled: enabled,
                        });

                        if (!enabled) {
                          setCalendarOpen(false);
                        }
                      }}
                    />

                    <span className="slider"></span>
                  </label>
                </div>

                {form.reminder_enabled && (
                  <div className="reminder-controls">
                    <div className="date-control">
                      <label>Date</label>

                      <button
                        type="button"
                        className="date-display"
                        onClick={() =>
                          setCalendarOpen(
                            (previous) =>
                              !previous
                          )
                        }
                      >
                        <span>📅</span>

                        <span>
                          {formatDate(
                            form.reminder_date
                          )}
                        </span>

                        <span className="date-arrow">
                          {calendarOpen
                            ? "⌃"
                            : "⌄"}
                        </span>
                      </button>

                      {calendarOpen && (
                        <CalendarPicker
                          value={
                            form.reminder_date
                          }
                          onChange={(date) =>
                            setForm({
                              ...form,
                              reminder_date:
                                date,
                            })
                          }
                          onClose={() =>
                            setCalendarOpen(false)
                          }
                        />
                      )}
                    </div>

                    <div className="time-repeat-row">
                      <div>
                        <label>Time</label>

                        <TimePicker
                          value={
                            form.reminder_time
                          }
                          onChange={(time) =>
                            setForm({
                              ...form,
                              reminder_time:
                                time,
                            })
                          }
                        />
                      </div>

                      <div className="repeat-control">
                        <label>Repeat</label>

                        <select
                          value={form.repeat}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              repeat:
                                e.target.value,
                            })
                          }
                        >
                          {REPEAT_OPTIONS.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="save-btn"
                onClick={saveNote}
              >
                {editingId
                  ? "Save Changes"
                  : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="delete-overlay">
          <div className="delete-modal">
            <div className="delete-icon">
              🗑️
            </div>

            <h2>Delete this note?</h2>

            <p>
              This action cannot be undone.
            </p>

            <div className="delete-actions">
              <button
                className="cancel-btn"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>

              <button
                className="delete-confirm-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
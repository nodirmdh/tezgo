"use client";

import { useState } from "react";
import { normalizeRole } from "../../../lib/rbac";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function OutletNotes({
  notes,
  role,
  authorTgId,
  loading,
  error,
  onAdd,
  onDelete
}) {
  const [text, setText] = useState("");
  const normalizedRole = normalizeRole(role);

  return (
    <section className="card profile-card">
      <div className="profile-title">Notes</div>
      {error ? <div className="banner error">{error}</div> : null}
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) {
            return;
          }
          onAdd(text.trim());
          setText("");
        }}
      >
        <div className="auth-field">
          <label htmlFor="noteText">Note</label>
          <textarea
            id="noteText"
            className="input"
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Add a note..."
          />
        </div>
        <button className="button" type="submit">
          Add
        </button>
      </form>

      {loading ? (
        <div className="skeleton-block" />
      ) : notes.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <ul className="log-list">
          {notes.map((note) => {
            const canDelete =
              normalizedRole === "admin" ||
              (authorTgId && note.author_tg_id === authorTgId);
            return (
              <li key={note.id} className="log-item">
                <div>
                  <div className="log-title">
                    {note.author_username || note.author_tg_id || "support"}
                  </div>
                  <div className="helper-text">{note.text}</div>
                </div>
                <div className="helper-text">{formatDate(note.created_at)}</div>
                {canDelete ? (
                  <button
                    className="action-link"
                    type="button"
                    onClick={() => onDelete(note.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
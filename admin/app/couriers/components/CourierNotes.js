"use client";

import { useState } from "react";
import { normalizeRole } from "../../../lib/rbac";
import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function CourierNotes({
  notes,
  role,
  authorTgId,
  loading,
  error,
  onAdd,
  onDelete
}) {
  const { t } = useLocale();
  const [text, setText] = useState("");
  const normalizedRole = normalizeRole(role);

  return (
    <section className="card profile-card">
      <div className="profile-title">{t("couriers.notes.title")}</div>
      {error ? <div className="banner error">{t(error)}</div> : null}
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
          <label htmlFor="noteText">{t("couriers.notes.note")}</label>
          <textarea
            id="noteText"
            className="input"
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("couriers.notes.placeholder")}
          />
        </div>
        <button className="button" type="submit">
          {t("common.add")}
        </button>
      </form>

      {loading ? (
        <div className="skeleton-block" />
      ) : notes.length === 0 ? (
        <div className="empty-state">{t("dashboard.noData")}</div>
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
                    {note.author_username || note.author_tg_id || t("couriers.notes.support")}
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
                    {t("common.delete")}
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

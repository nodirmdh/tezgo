"use client";

import { useState } from "react";
import { useLocale } from "../../components/LocaleProvider";

export default function ClientCrmNote({ value, updatedAt, saving, onSave }) {
  const { t } = useLocale();
  const [note, setNote] = useState(value || "");

  return (
    <section className="card profile-card embedded-card">
      <div className="profile-title">{t("clients.crm.title")}</div>
      <div className="auth-field">
        <label htmlFor="crmNote">{t("clients.crm.label")}</label>
        <textarea
          id="crmNote"
          className="input"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("clients.crm.placeholder")}
        />
        <div className="helper-text">
          {updatedAt
            ? `${t("clients.crm.updatedAt")}: ${new Date(updatedAt).toLocaleString()}`
            : t("clients.crm.noUpdates")}
        </div>
      </div>
      <div className="modal-actions">
        <button className="button" type="button" onClick={() => onSave(note)} disabled={saving}>
          {saving ? t("clients.crm.saving") : t("common.save")}
        </button>
      </div>
    </section>
  );
}

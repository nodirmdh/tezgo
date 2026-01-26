"use client";

import { useState } from "react";
import { useLocale } from "../../components/LocaleProvider";

const actions = [
  { key: "delete_email", labelKey: "clients.danger.deleteEmail" },
  { key: "reset_passport_uid", labelKey: "clients.danger.resetPassport" }
];

export default function ClientDangerZone({ status, onAction, onBanToggle }) {
  const { t } = useLocale();
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState("");

  const openModal = (actionType) => {
    setReason("");
    setModal(actionType);
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }
    if (modal === "ban_toggle") {
      await onBanToggle(reason.trim());
      setModal(null);
      return;
    }
    await onAction(modal, reason.trim());
    setModal(null);
  };

  const banLabel =
    status === "active"
      ? t("clients.danger.banClient")
      : t("clients.danger.unbanClient");

  return (
    <section className="card profile-card embedded-card">
      <div className="profile-title">{t("clients.danger.title")}</div>
      <div className="danger-actions">
        {actions.map((action) => (
          <button
            key={action.key}
            className="button danger"
            type="button"
            onClick={() => openModal(action.key)}
          >
            {t(action.labelKey)}
          </button>
        ))}
        <button className="button danger" type="button" onClick={() => openModal("ban_toggle")}>
          {banLabel}
        </button>
      </div>

      {modal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{t("clients.danger.reasonTitle")}</div>
              <button className="modal-close" type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="auth-field">
              <label htmlFor="dangerReason">{t("clients.danger.reasonLabel")}</label>
              <textarea
                id="dangerReason"
                className="input"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("clients.danger.reasonPlaceholder")}
              />
            </div>
            <div className="modal-actions">
              <button className="button danger" type="button" onClick={handleConfirm}>
                {t("clients.danger.confirm")}
              </button>
              <button className="button ghost" type="button" onClick={() => setModal(null)}>
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

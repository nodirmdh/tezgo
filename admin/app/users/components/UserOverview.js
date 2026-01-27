"use client";

import { useMemo } from "react";
import { translateRole, translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function UserOverview({
  user,
  role,
  onUpdate,
  onDelete,
  onToast,
  embedded = false
}) {
  const { locale, t } = useLocale();
  const isAdmin = useMemo(() => role === "Admin", [role]);

  const handleSubmit = async (event, action) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await action(formData);
    event.currentTarget.reset();
  };

  return (
    <div className="profile-grid">
      <section className={`card profile-card${embedded ? " embedded-card" : ""}`}>
        <div className="profile-title">{t("users.overview.title")}</div>
        <div className="profile-row">
          <span className="muted">{t("users.table.tgId")}</span>
          <span>{user.tg_id}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("users.table.username")}</span>
          <span>{user.username}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("users.table.role")}</span>
          <span>{translateRole(locale, user.role)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("users.table.status")}</span>
          <span>{translateStatus(locale, user.status)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("users.fields.createdAt")}</span>
          <span>{formatDate(user.created_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("users.fields.updatedAt")}</span>
          <span>{formatDate(user.updated_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("users.fields.lastActive")}</span>
          <span>{formatDate(user.last_active)}</span>
        </div>
      </section>

      <section className={`card profile-card${embedded ? " embedded-card" : ""}`}>
        <div className="profile-title">{t("users.overview.actions")}</div>
        <div className="action-grid">
          <form onSubmit={(event) => handleSubmit(event, onUpdate)}>
            <div className="auth-field">
              <label htmlFor="username">{t("users.overview.changeUsername")}</label>
              <input
                id="username"
                name="username"
                className="input"
                placeholder="@username"
              />
            </div>
            <button className="button" type="submit">
              {t("common.save")}
            </button>
          </form>

          <form onSubmit={(event) => handleSubmit(event, onUpdate)}>
            <div className="auth-field">
              <label htmlFor="role">{t("users.overview.changeRole")}</label>
              <select id="role" name="role" className="select">
                <option value="">{t("users.overview.chooseRole")}</option>
                {["client", "courier", "partner", "admin", "support"].map((item) => (
                  <option key={item} value={item}>
                    {translateRole(locale, item)}
                  </option>
                ))}
              </select>
            </div>
            <button className="button" type="submit" disabled={!isAdmin}>
              {t("users.overview.changeRole")}
            </button>
            {!isAdmin ? (
              <div className="helper-text">{t("users.overview.onlyAdmin")}</div>
            ) : null}
          </form>

          <form onSubmit={(event) => handleSubmit(event, onUpdate)}>
            <div className="auth-field">
              <label htmlFor="status">{t("users.overview.changeStatus")}</label>
              <select id="status" name="status" className="select">
                <option value="">{t("users.overview.chooseStatus")}</option>
                <option value="active">{t("users.overview.unblock")}</option>
                <option value="blocked">{t("users.overview.block")}</option>
              </select>
            </div>
            <button className="button" type="submit" disabled={!isAdmin}>
              {t("common.apply")}
            </button>
          </form>

          {isAdmin ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                await onDelete();
                onToast(t("users.toasts.deleted"), "success");
              }}
            >
              <div className="auth-field">
                <label>{t("users.overview.deleteUser")}</label>
                <div className="helper-text">{t("users.overview.deleteWarning")}</div>
              </div>
              <button className="button danger" type="submit">
                {t("common.delete")}
              </button>
            </form>
          ) : (
            <div className="helper-text">{t("users.overview.deleteOnlyAdmin")}</div>
          )}
        </div>
      </section>
    </div>
  );
}

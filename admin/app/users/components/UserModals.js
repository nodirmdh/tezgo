"use client";

import { useState } from "react";
import { useLocale } from "../../components/LocaleProvider";
import { translateRole, translateStatus } from "../../../lib/i18n";

const Modal = ({ open, title, onClose, children }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" type="button" onClick={onClose}>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export function CreateUserModal({ onCreate }) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button" type="button" onClick={() => setOpen(true)}>
        {t("common.add")}
      </button>
      <Modal
        open={open}
        title={t("users.modals.addTitle")}
        onClose={() => setOpen(false)}
      >
        <form
          className="form-grid"
          action={onCreate}
          onSubmit={() => setOpen(false)}
        >
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="tgId">TG ID</label>
              <input id="tgId" name="tg_id" className="input" placeholder="TG-1001" />
            </div>
            <div className="auth-field">
              <label htmlFor="username">{t("users.modals.username")}</label>
              <input
                id="username"
                name="username"
                className="input"
                placeholder="@new_user"
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="role">{t("users.modals.role")}</label>
              <select id="role" name="role" className="select">
                {["client", "courier", "partner", "admin", "support"].map((item) => (
                  <option key={item} value={item}>
                    {translateRole(locale, item)}
                  </option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="status">{t("users.modals.status")}</label>
              <select id="status" name="status" className="select">
                {["active", "blocked"].map((item) => (
                  <option key={item} value={item}>
                    {translateStatus(locale, item)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="button" type="submit">
              {t("users.modals.create")}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function UpdateUserModal({ onUpdate }) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button" type="button" onClick={() => setOpen(true)}>
        {t("common.edit")}
      </button>
      <Modal
        open={open}
        title={t("users.modals.updateTitle")}
        onClose={() => setOpen(false)}
      >
        <form
          className="form-grid"
          action={onUpdate}
          onSubmit={() => setOpen(false)}
        >
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="updateUserId">{t("users.modals.userId")}</label>
              <input id="updateUserId" name="id" className="input" placeholder="1" />
            </div>
            <div className="auth-field">
              <label htmlFor="updateUserName">{t("users.modals.username")}</label>
              <input
                id="updateUserName"
                name="username"
                className="input"
                placeholder="@username"
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="updateUserRole">{t("users.modals.role")}</label>
              <select id="updateUserRole" name="role" className="select">
                <option value="">{t("users.modals.keep")}</option>
                {["client", "courier", "partner", "admin", "support"].map((item) => (
                  <option key={item} value={item}>
                    {translateRole(locale, item)}
                  </option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="updateUserStatus">{t("users.modals.status")}</label>
              <select id="updateUserStatus" name="status" className="select">
                <option value="">{t("users.modals.keep")}</option>
                {["active", "blocked"].map((item) => (
                  <option key={item} value={item}>
                    {translateStatus(locale, item)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="button" type="submit">
              {t("users.modals.update")}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteUserModal({ onDelete }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button danger" type="button" onClick={() => setOpen(true)}>
        {t("common.delete")}
      </button>
      <Modal
        open={open}
        title={t("users.modals.deleteTitle")}
        onClose={() => setOpen(false)}
      >
        <form
          className="form-grid"
          action={onDelete}
          onSubmit={() => setOpen(false)}
        >
          <div className="form-row">
            <div className="auth-field">
              <label htmlFor="deleteUserId">{t("users.modals.userId")}</label>
              <input id="deleteUserId" name="id" className="input" placeholder="1" />
            </div>
          </div>
          <div className="helper-text">{t("users.modals.irreversible")}</div>
          <div className="modal-actions">
            <button className="button danger" type="submit">
              {t("users.modals.delete")}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

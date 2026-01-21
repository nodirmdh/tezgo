"use client";

import { useState } from "react";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { normalizeRole } from "../../../lib/rbac";
import {
  issueClientPromo,
  revokeClientPromo
} from "../../../lib/api/clientPromosApi";
import { useLocale } from "../../components/LocaleProvider";

const emptyForm = {
  type: "percent",
  value: "",
  expiresAt: "",
  minOrderAmount: "",
  relatedOrderId: "",
  reason: ""
};

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
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

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function ClientPromos({
  clientId,
  promos,
  loading,
  error,
  role,
  onReload
}) {
  const { t } = useLocale();
  const [toast, setToast] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { confirm, dialog } = useConfirm();

  const canManage = ["admin", "support"].includes(normalizeRole(role));

  const handleIssue = async (event) => {
    event.preventDefault();
    if (!form.reason.trim()) {
      setToast({ type: "error", message: t("clients.promos.reasonRequired") });
      return;
    }
    if (!form.value) {
      setToast({ type: "error", message: t("clients.promos.valueRequired") });
      return;
    }
    const payload = {
      type: form.type,
      value: Number(form.value),
      expiresAt: form.expiresAt || null,
      minOrderAmount:
        form.minOrderAmount !== "" ? Number(form.minOrderAmount) : null,
      relatedOrderId: form.relatedOrderId || null,
      reason: form.reason
    };
    const result = await issueClientPromo(clientId, payload);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({
      type: "success",
      message: t("clients.promos.issued", { code: result.data.code })
    });
    setForm(emptyForm);
    setOpen(false);
    onReload();
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setToast({ type: "success", message: t("clients.promos.copied") });
  };

  const handleRevoke = (promo) => {
    confirm({
      title: t("clients.promos.revokeTitle"),
      description: t("clients.promos.revokeDescription"),
      onConfirm: async () => {
        const result = await revokeClientPromo(clientId, promo.id);
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("clients.promos.revoked") });
        onReload();
      }
    });
  };

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="profile-title">{t("clients.promos.title")}</div>
      {error ? <div className="banner error">{t(error)}</div> : null}
      <div className="toolbar">
        <div className="toolbar-actions">
          {canManage ? (
            <button className="button" type="button" onClick={() => setOpen(true)}>
              {t("clients.promos.issue")}
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="skeleton-block" />
      ) : promos.length === 0 ? (
        <div className="empty-state">{t("clients.promos.none")}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("clients.promos.table.code")}</th>
              <th>{t("clients.promos.table.typeValue")}</th>
              <th>{t("clients.promos.table.status")}</th>
              <th>{t("clients.promos.table.expires")}</th>
              <th>{t("clients.promos.table.reason")}</th>
              <th>{t("clients.promos.table.issuedBy")}</th>
              <th>{t("clients.promos.table.issuedAt")}</th>
              <th>{t("clients.promos.table.order")}</th>
              <th>{t("clients.promos.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => (
              <tr key={promo.id}>
                <td>
                  <div className="table-actions">
                    <span>{promo.code}</span>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleCopy(promo.code)}
                    >
                      {t("clients.promos.copy")}
                    </button>
                  </div>
                </td>
                <td>{`${promo.type} ${promo.value}`}</td>
                <td>
                  <span className="badge">{promo.status}</span>
                </td>
                <td>{promo.expires_at || "-"}</td>
                <td>{promo.reason}</td>
                <td>{promo.issued_by_username || promo.issued_by_user_id || "-"}</td>
                <td>{formatDate(promo.issued_at)}</td>
                <td>{promo.related_order_id || "-"}</td>
                <td>
                  {canManage && promo.status === "active" ? (
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleRevoke(promo)}
                    >
                      {t("clients.promos.revoke")}
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={open} title={t("clients.promos.issue")} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={handleIssue}>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoType">{t("clients.promos.form.type")}</label>
              <select
                id="promoType"
                className="select"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                <option value="percent">percent</option>
                <option value="fixed">fixed</option>
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="promoValue">{t("clients.promos.form.value")}</label>
              <input
                id="promoValue"
                className="input"
                value={form.value}
                onChange={(event) => setForm({ ...form, value: event.target.value })}
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoExpires">{t("clients.promos.form.expires")}</label>
              <input
                id="promoExpires"
                className="input"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="promoMin">{t("clients.promos.form.minOrder")}</label>
              <input
                id="promoMin"
                className="input"
                value={form.minOrderAmount}
                onChange={(event) =>
                  setForm({ ...form, minOrderAmount: event.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoOrder">{t("clients.promos.form.relatedOrder")}</label>
              <input
                id="promoOrder"
                className="input"
                value={form.relatedOrderId}
                onChange={(event) =>
                  setForm({ ...form, relatedOrderId: event.target.value })
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="promoReason">{t("clients.promos.form.reason")}</label>
              <textarea
                id="promoReason"
                className="input"
                rows={3}
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="button" type="submit">
              {t("clients.promos.issue")}
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
    </section>
  );
}

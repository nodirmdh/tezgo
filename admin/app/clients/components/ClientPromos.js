"use client";

import { useState } from "react";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { normalizeRole } from "../../../lib/rbac";
import {
  issueClientPromo,
  revokeClientPromo
} from "../../../lib/api/clientPromosApi";

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
            ×
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
  const [toast, setToast] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { confirm, dialog } = useConfirm();

  const canManage = ["admin", "support"].includes(normalizeRole(role));


  const handleIssue = async (event) => {
    event.preventDefault();
    if (!form.reason.trim()) {
      setToast({ type: "error", message: "Reason is required" });
      return;
    }
    if (!form.value) {
      setToast({ type: "error", message: "Value is required" });
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
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: `Promo issued: ${result.data.code}` });
    setForm(emptyForm);
    setOpen(false);
    onReload();
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setToast({ type: "success", message: "Code copied" });
  };

  const handleRevoke = (promo) => {
    confirm({
      title: "Revoke promo?",
      description: "Promo will be revoked immediately.",
      onConfirm: async () => {
        const result = await revokeClientPromo(clientId, promo.id);
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "Promo revoked" });
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
      <div className="profile-title">Promos</div>
      {error ? <div className="banner error">{error}</div> : null}
      <div className="toolbar">
        <div className="toolbar-actions">
          {canManage ? (
            <button className="button" type="button" onClick={() => setOpen(true)}>
              Issue promo
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="skeleton-block" />
      ) : promos.length === 0 ? (
        <div className="empty-state">No promos issued yet</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type/Value</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Reason</th>
              <th>Issued by</th>
              <th>Issued at</th>
              <th>Order</th>
              <th>Actions</th>
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
                      Copy
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
                      Revoke
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

      <Modal open={open} title="Issue promo" onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={handleIssue}>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoType">Type</label>
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
              <label htmlFor="promoValue">Value</label>
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
              <label htmlFor="promoExpires">Expires at</label>
              <input
                id="promoExpires"
                className="input"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="promoMin">Min order amount</label>
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
              <label htmlFor="promoOrder">Related order</label>
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
              <label htmlFor="promoReason">Reason</label>
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
              Issue
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

    </section>
  );
}

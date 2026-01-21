"use client";

import { useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";
import { useLocale } from "../../components/LocaleProvider";

const canManageOrders = (role) =>
  ["admin", "support", "operator"].includes(normalizeRole(role));

export default function OrderActions({ orderId, role, titleKey = "orders.support.title" }) {
  const { t } = useLocale();
  const [toast, setToast] = useState(null);
  const [courierId, setCourierId] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [compReason, setCompReason] = useState("");
  const [compMode, setCompMode] = useState("amount");
  const [compValue, setCompValue] = useState("");
  const [compComment, setCompComment] = useState("");
  const [compSubmitting, setCompSubmitting] = useState(false);

  const handleCancel = async () => {
    const reason = window.prompt(t("orders.support.cancelReason"), "");
    if (reason === null) {
      return;
    }
    const result = await apiJson(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("orders.support.cancelled") });
  };

  const handleReassign = async () => {
    if (!courierId) {
      return;
    }
    const result = await apiJson(`/api/orders/${orderId}/reassign`, {
      method: "POST",
      body: JSON.stringify({ courier_user_id: Number(courierId) })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("orders.support.reassigned") });
    setCourierId("");
  };

  const handleNotify = async () => {
    if (!notifyMessage.trim()) {
      setToast({ type: "error", message: t("orders.support.notifyRequired") });
      return;
    }
    const result = await apiJson(`/api/orders/${orderId}/notify`, {
      method: "POST",
      body: JSON.stringify({ message: notifyMessage })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("orders.support.notified") });
    setNotifyMessage("");
  };

  const handleResend = async () => {
    const confirmed = window.confirm(t("orders.support.resendConfirm"));
    if (!confirmed) {
      return;
    }
    const result = await apiJson(`/api/orders/${orderId}/resend`, {
      method: "POST"
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("orders.support.resendOk") });
  };

  const handleCompensation = async (event) => {
    event.preventDefault();
    if (!compReason.trim() || !compValue) {
      setToast({ type: "error", message: t("orders.compensation.required") });
      return;
    }
    setCompSubmitting(true);
    const result = await apiJson(`/api/orders/${orderId}/compensation`, {
      method: "POST",
      body: JSON.stringify({
        reason: compReason,
        mode: compMode,
        value: Number(compValue),
        comment: compComment
      })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setCompSubmitting(false);
      return;
    }
    setToast({ type: "success", message: t("orders.compensation.issued") });
    setCompReason("");
    setCompValue("");
    setCompComment("");
    setCompSubmitting(false);
  };

  const canManage = canManageOrders(role);

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-title">{t(titleKey)}</div>
      {!canManage ? (
        <div className="empty-state">{t("orders.support.noAccess")}</div>
      ) : (
        <div className="action-grid">
          <button className="button danger" type="button" onClick={handleCancel}>
            {t("orders.support.cancelOrder")}
          </button>
          <div className="form-row two">
            <input
              className="input"
              placeholder={t("orders.support.courierId")}
              value={courierId}
              onChange={(event) => setCourierId(event.target.value)}
            />
            <button className="button" type="button" onClick={handleReassign}>
              {t("orders.support.reassignCourier")}
            </button>
          </div>
          <div className="form-row two">
            <input
              className="input"
              placeholder={t("orders.support.notifyPlaceholder")}
              value={notifyMessage}
              onChange={(event) => setNotifyMessage(event.target.value)}
            />
            <button className="button" type="button" onClick={handleNotify}>
              {t("orders.support.notifyClient")}
            </button>
          </div>
          <button className="button" type="button" onClick={handleResend}>
            {t("orders.support.resendRestaurant")}
          </button>
          <form className="form-grid" onSubmit={handleCompensation}>
            <div className="auth-field">
              <label htmlFor="compReason">{t("orders.compensation.reason")}</label>
              <input
                id="compReason"
                className="input"
                value={compReason}
                onChange={(event) => setCompReason(event.target.value)}
                placeholder={t("orders.compensation.reasonPlaceholder")}
              />
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="compMode">{t("orders.compensation.mode")}</label>
                <select
                  id="compMode"
                  className="select"
                  value={compMode}
                  onChange={(event) => setCompMode(event.target.value)}
                >
                  <option value="amount">{t("orders.compensation.amount")}</option>
                  <option value="percent">{t("orders.compensation.percent")}</option>
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="compValue">{t("orders.compensation.value")}</label>
                <input
                  id="compValue"
                  className="input"
                  type="number"
                  min="0"
                  value={compValue}
                  onChange={(event) => setCompValue(event.target.value)}
                  placeholder={t("orders.compensation.valuePlaceholder")}
                />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="compComment">{t("orders.compensation.comment")}</label>
              <textarea
                id="compComment"
                className="input"
                value={compComment}
                onChange={(event) => setCompComment(event.target.value)}
                placeholder={t("orders.compensation.commentPlaceholder")}
              />
            </div>
            <div className="modal-actions">
              <button className="button" type="submit" disabled={compSubmitting}>
                {compSubmitting
                  ? t("orders.compensation.submitting")
                  : t("orders.compensation.issue")}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

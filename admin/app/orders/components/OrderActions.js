"use client";

import { useMemo, useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";
import { useLocale } from "../../components/LocaleProvider";
import useConfirm from "../../components/useConfirm";

const canManageOrders = (role) =>
  ["admin", "support", "operator"].includes(normalizeRole(role));

export default function OrderActions({
  orderId,
  role,
  titleKey = "orders.support.title",
  onCancelled
}) {
  const { locale, t } = useLocale();
  const { confirm, dialog } = useConfirm();
  const [toast, setToast] = useState(null);
  const [courierId, setCourierId] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [compReason, setCompReason] = useState("");
  const [compMode, setCompMode] = useState("amount");
  const [compValue, setCompValue] = useState("");
  const [compComment, setCompComment] = useState("");
  const [compSubmitting, setCompSubmitting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelReasons, setCancelReasons] = useState({
    client: [],
    partner: [],
    courier: []
  });
  const [selectedReason, setSelectedReason] = useState(null);
  const [cancelComment, setCancelComment] = useState("");
  const [notifyClientOnCancel, setNotifyClientOnCancel] = useState(true);
  const [clientNotified, setClientNotified] = useState(false);

  const cancelReasonGroups = [
    { key: "partner", labelKey: "orders.cancellation.groups.partner" },
    { key: "client", labelKey: "orders.cancellation.groups.client" },
    { key: "courier", labelKey: "orders.cancellation.groups.courier" }
  ];

  const effectLabels = [
    { key: "refund_client", labelKey: "orders.cancellation.effects.refundClient" },
    { key: "compensate_partner", labelKey: "orders.cancellation.effects.compensatePartner" },
    { key: "penalty_partner", labelKey: "orders.cancellation.effects.penaltyPartner" },
    { key: "penalty_courier", labelKey: "orders.cancellation.effects.penaltyCourier" },
    { key: "restore_promo", labelKey: "orders.cancellation.effects.restorePromo" },
    { key: "issue_promo", labelKey: "orders.cancellation.effects.issuePromo" }
  ];

  const loadCancelReasons = async () => {
    setCancelLoading(true);
    const result = await apiJson("/api/cancel-reasons");
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setCancelLoading(false);
      return;
    }
    setCancelReasons(result.data?.groups || { client: [], partner: [], courier: [] });
    setCancelLoading(false);
  };

  const openCancelModal = async () => {
    setCancelOpen(true);
    if (
      !cancelReasons.client.length &&
      !cancelReasons.partner.length &&
      !cancelReasons.courier.length
    ) {
      await loadCancelReasons();
    }
  };

  const selectedEffects = useMemo(() => {
    if (!selectedReason?.effects_json) {
      return {};
    }
    try {
      return JSON.parse(selectedReason.effects_json);
    } catch {
      return {};
    }
  }, [selectedReason]);

  const getReasonLabel = (reason) =>
    reason?.[`label_${locale}`] || reason?.label_ru || reason?.code;

  const handleCancelSubmit = async () => {
    if (!selectedReason) {
      setToast({ type: "error", message: t("orders.cancellation.reasonRequired") });
      return;
    }
    if (selectedReason.requires_comment && !cancelComment.trim()) {
      setToast({ type: "error", message: t("orders.cancellation.commentRequired") });
      return;
    }
    confirm({
      title: t("orders.cancellation.confirmTitle"),
      description: t("orders.cancellation.confirmDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/orders/${orderId}/cancel`, {
          method: "POST",
          body: JSON.stringify({
            reason_code: selectedReason.code,
            comment: cancelComment.trim() || null,
            notify_client: notifyClientOnCancel,
            client_notified: clientNotified
          })
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("orders.support.cancelled") });
        onCancelled?.(result.data);
        setCancelOpen(false);
        setSelectedReason(null);
        setCancelComment("");
        setNotifyClientOnCancel(true);
        setClientNotified(false);
      }
    });
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
      {dialog}
      <div className="profile-title">{t(titleKey)}</div>
      {!canManage ? (
        <div className="empty-state">{t("orders.support.noAccess")}</div>
      ) : (
        <div className="action-grid">
          <button className="button danger" type="button" onClick={openCancelModal}>
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

      {cancelOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{t("orders.cancellation.title")}</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setCancelOpen(false)}
              >
                ×
              </button>
            </div>

            {cancelLoading ? (
              <div className="skeleton-block" />
            ) : (
              <div className="cancel-modal-grid">
                <div>
                  <div className="helper-text">{t("orders.cancellation.chooseReason")}</div>
                  <div className="cancel-reasons">
                    {cancelReasonGroups.map((group) => (
                      <details key={group.key} className="cancel-group" open>
                        <summary>{t(group.labelKey)}</summary>
                        <div className="cancel-group-body">
                          {(cancelReasons[group.key] || []).map((reason) => (
                            <label key={reason.code} className="cancel-reason">
                              <input
                                type="radio"
                                name="cancelReason"
                                value={reason.code}
                                checked={selectedReason?.code === reason.code}
                                onChange={() => setSelectedReason(reason)}
                              />
                              <span>{getReasonLabel(reason)}</span>
                              {reason.requires_comment ? (
                                <span className="cancel-tag">
                                  {t("orders.cancellation.commentRequiredShort")}
                                </span>
                              ) : null}
                            </label>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>

                <div className="cancel-effects">
                  <div className="helper-text">{t("orders.cancellation.effectsTitle")}</div>
                  {selectedReason ? (
                    <div className="effects-grid">
                      {effectLabels.map((effect) => {
                        const enabled = Boolean(selectedEffects[effect.key]);
                        return (
                          <div key={effect.key} className="effects-item">
                            <span className={`effects-dot ${enabled ? "on" : "off"}`} />
                            <span>{t(effect.labelKey)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      {t("orders.cancellation.effectsEmpty")}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="form-grid">
              {selectedReason?.requires_comment ? (
                <div className="auth-field">
                  <label htmlFor="cancelComment">{t("orders.cancellation.comment")}</label>
                  <textarea
                    id="cancelComment"
                    className="input"
                    value={cancelComment}
                    onChange={(event) => setCancelComment(event.target.value)}
                    placeholder={t("orders.cancellation.commentPlaceholder")}
                  />
                </div>
              ) : null}
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={clientNotified}
                  onChange={(event) => setClientNotified(event.target.checked)}
                />
                {t("orders.cancellation.clientNotified")}
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={notifyClientOnCancel}
                  onChange={(event) => setNotifyClientOnCancel(event.target.checked)}
                />
                {t("orders.cancellation.notifyClient")}
              </label>
            </div>

            <div className="modal-actions">
              <button className="button danger" type="button" onClick={handleCancelSubmit}>
                {t("orders.cancellation.submit")}
              </button>
              <button className="button ghost" type="button" onClick={() => setCancelOpen(false)}>
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";
import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");
const toMs = (value) => {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
};
const formatMinutes = (value) =>
  value === null || value === undefined ? "-" : `${value}m`;

const typeKeys = {
  created: "orders.timeline.types.created",
  accepted: "orders.timeline.types.accepted",
  accepted_by_outlet: "orders.timeline.types.accepted",
  accepted_by_restaurant: "orders.timeline.types.accepted",
  cooking_started: "orders.timeline.types.cooking",
  ready: "orders.timeline.types.ready",
  ready_for_pickup: "orders.timeline.types.readyForPickup",
  courier_search_started: "orders.timeline.types.courierSearch",
  courier_assigned: "orders.timeline.types.courierAssigned",
  picked_up: "orders.timeline.types.pickedUp",
  out_for_delivery: "orders.timeline.types.outForDelivery",
  delivered: "orders.timeline.types.delivered",
  cancelled: "orders.timeline.types.cancelled",
  refunded: "orders.timeline.types.refunded",
  note_added: "orders.timeline.types.note",
  compensation_issued: "orders.timeline.types.compensation",
  cart_updated: "orders.timeline.types.cartUpdated",
  notify_client: "orders.timeline.types.notifyClient",
  resend_to_restaurant: "orders.timeline.types.resendRestaurant"
};

const renderSlaValue = (label, value, breached) => (
  <div className={`sla-card ${breached ? "breached" : ""}`}>
    <div className="helper-text">{label}</div>
    <div className="card-value">{formatMinutes(value)}</div>
  </div>
);

export default function OrderTimeline({
  order,
  events,
  loading,
  error,
  role,
  onNoteAdded
}) {
  const { t } = useLocale();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const canAddNote = ["admin", "support"].includes(normalizeRole(role));
  const eventTypes = new Set(events.map((event) => event.type));
  const promisedAtMs = toMs(order?.promised_delivery_at);
  const deliveredAtMs = toMs(order?.delivered_at);
  const nowMs = Date.now();
  const hasPromised = Boolean(promisedAtMs);
  const delayMinutes =
    hasPromised && (deliveredAtMs ?? nowMs) > promisedAtMs
      ? Math.round(((deliveredAtMs ?? nowMs) - promisedAtMs) / 60000)
      : null;
  const stages = [
    {
      key: "accepted",
      labelKey: "orders.timeline.stages.accepted",
      done: ["accepted", "accepted_by_outlet", "accepted_by_restaurant"].some(
        (type) => eventTypes.has(type)
      )
    },
    {
      key: "ready",
      labelKey: "orders.timeline.stages.ready",
      done: ["ready", "ready_for_pickup"].some((type) => eventTypes.has(type))
    },
    {
      key: "courierArrived",
      labelKey: "orders.timeline.stages.courierArrived",
      done: ["courier_arrived_at_restaurant", "picked_up"].some((type) =>
        eventTypes.has(type)
      )
    },
    {
      key: "pickedUp",
      labelKey: "orders.timeline.stages.pickedUp",
      done: ["picked_up"].some((type) => eventTypes.has(type))
    },
    {
      key: "courierArrivedClient",
      labelKey: "orders.timeline.stages.courierArrivedClient",
      done: ["courier_arrived_to_client", "delivered"].some((type) =>
        eventTypes.has(type)
      )
    },
    {
      key: "delivered",
      labelKey: "orders.timeline.stages.delivered",
      done: ["delivered"].some((type) => eventTypes.has(type))
    }
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = note.trim();
    if (!text) {
      setToast({ type: "error", message: t("orders.timeline.noteRequired") });
      return;
    }
    setSubmitting(true);
    const result = await apiJson(`/api/orders/${order.id}/events`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setSubmitting(false);
      return;
    }
    setToast({ type: "success", message: t("orders.timeline.noteAdded") });
    setNote("");
    setSubmitting(false);
    onNoteAdded?.();
  };

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-title">{t("tabs.timeline")}</div>
      <div className="card-grid">
        <div className="card">
          <div className="helper-text">{t("orders.timeline.summary.promisedAt")}</div>
          <div className="card-value">{formatDate(order?.promised_delivery_at)}</div>
        </div>
        <div className="card">
          <div className="helper-text">
            {t("orders.timeline.summary.cookingMinutes")}
          </div>
          <div className="card-value">{formatMinutes(order?.slaSummary?.cookingMinutes)}</div>
        </div>
        <div className="card">
          <div className="helper-text">
            {t("orders.timeline.summary.deliveryMinutes")}
          </div>
          <div className="card-value">{formatMinutes(order?.slaSummary?.deliveryMinutes)}</div>
        </div>
        <div className="card">
          <div className="helper-text">{t("orders.timeline.summary.delay")}</div>
          <div className="card-value">
            {delayMinutes === null ? "-" : formatMinutes(delayMinutes)}
          </div>
        </div>
      </div>
      {order?.slaSummary ? (
        <div className="card-grid sla-grid">
          {renderSlaValue(
            t("orders.timeline.sla.courierSearch"),
            order.slaSummary.courierSearchMinutes,
            order.slaSummary.breaches?.courierSearch
          )}
          {renderSlaValue(
            t("orders.timeline.sla.cooking"),
            order.slaSummary.cookingMinutes,
            order.slaSummary.breaches?.cooking
          )}
          {renderSlaValue(
            t("orders.timeline.sla.waitingPickup"),
            order.slaSummary.waitingPickupMinutes,
            order.slaSummary.breaches?.waitingPickup
          )}
          {renderSlaValue(
            t("orders.timeline.sla.delivery"),
            order.slaSummary.deliveryMinutes,
            order.slaSummary.breaches?.delivery
          )}
        </div>
      ) : null}

      <div className="card">
        <div className="card-title">{t("orders.timeline.stages.title")}</div>
        <ul className="log-list">
          {stages.map((stage) => (
            <li key={stage.key} className="log-item">
              <div className="log-title">{t(stage.labelKey)}</div>
              <span className="badge">
                {stage.done
                  ? t("orders.timeline.stages.done")
                  : t("orders.timeline.stages.pending")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {order?.problems?.length ? (
        <div className="card">
          <div className="card-title">{t("orders.timeline.problems")}</div>
          <ul className="log-list">
            {order.problems.map((problem) => (
              <li key={problem.key} className="log-item">
                <div>
                  <div className="log-title">{problem.title}</div>
                  <div className="helper-text">{problem.details || "-"}</div>
                </div>
                <span className={`badge severity ${problem.severity}`}>
                  {t(`orders.severity.${problem.severity}`, {
                    defaultValue: problem.severity
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="empty-state">{t("orders.timeline.noProblems")}</div>
      )}

      {canAddNote ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="orderNote">{t("orders.timeline.addNote")}</label>
            <textarea
              id="orderNote"
              className="input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("orders.timeline.notePlaceholder")}
            />
          </div>
          <div className="modal-actions">
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? t("orders.timeline.saving") : t("orders.timeline.addNote")}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : events.length === 0 ? (
        <div className="empty-state">{t("orders.timeline.noEvents")}</div>
      ) : (
        <ul className="log-list">
          {events.map((event) => (
            <li key={event.id} className="log-item">
              <div>
                <div className="log-title">
                  {t(typeKeys[event.type], { defaultValue: event.type })}
                </div>
                <div className="helper-text">
                  {event.actor_username || t("orders.timeline.system")}
                </div>
                {event.payload?.text ? (
                  <div className="helper-text">{event.payload.text}</div>
                ) : null}
                {event.payload?.reason ? (
                  <div className="helper-text">
                    {t("orders.timeline.reason")}: {event.payload.reason}
                  </div>
                ) : null}
                {event.payload?.comment ? (
                  <div className="helper-text">
                    {t("orders.details.saveComment")}: {event.payload.comment}
                  </div>
                ) : null}
                {event.payload?.message ? (
                  <div className="helper-text">{event.payload.message}</div>
                ) : null}
                {event.payload?.value ? (
                  <div className="helper-text">
                    {t("orders.compensation.value")}: {event.payload.value}
                    {event.payload.mode === "percent" ? "%" : ""}
                  </div>
                ) : null}
              </div>
              <div className="helper-text">{formatDate(event.created_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

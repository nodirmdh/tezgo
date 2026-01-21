"use client";

import { useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const typeLabels = {
  created: "Order created",
  accepted: "Accepted by outlet",
  accepted_by_outlet: "Accepted by outlet",
  accepted_by_restaurant: "Accepted by outlet",
  cooking_started: "Cooking started",
  ready: "Order ready",
  ready_for_pickup: "Ready for pickup",
  courier_search_started: "Courier search started",
  courier_assigned: "Courier assigned",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  note_added: "Support note"
};

const formatMinutes = (value) =>
  value === null || value === undefined ? "-" : `${value}m`;

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
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const canAddNote = ["admin", "support"].includes(normalizeRole(role));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = note.trim();
    if (!text) {
      setToast({ type: "error", message: "Note text required" });
      return;
    }
    setSubmitting(true);
    const result = await apiJson(`/api/orders/${order.id}/events`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      setSubmitting(false);
      return;
    }
    setToast({ type: "success", message: "Note added" });
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
      <div className="profile-title">Timeline</div>
      {order?.slaSummary ? (
        <div className="card-grid sla-grid">
          {renderSlaValue(
            "Courier search",
            order.slaSummary.courierSearchMinutes,
            order.slaSummary.breaches?.courierSearch
          )}
          {renderSlaValue(
            "Cooking",
            order.slaSummary.cookingMinutes,
            order.slaSummary.breaches?.cooking
          )}
          {renderSlaValue(
            "Waiting pickup",
            order.slaSummary.waitingPickupMinutes,
            order.slaSummary.breaches?.waitingPickup
          )}
          {renderSlaValue(
            "Delivery",
            order.slaSummary.deliveryMinutes,
            order.slaSummary.breaches?.delivery
          )}
        </div>
      ) : null}

      {order?.problems?.length ? (
        <div className="card">
          <div className="card-title">Problems</div>
          <ul className="log-list">
            {order.problems.map((problem) => (
              <li key={problem.key} className="log-item">
                <div>
                  <div className="log-title">{problem.title}</div>
                  <div className="helper-text">{problem.details || "-"}</div>
                </div>
                <span className={`badge severity ${problem.severity}`}>
                  {problem.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="empty-state">No problem flags</div>
      )}

      {canAddNote ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="orderNote">Add note</label>
            <textarea
              id="orderNote"
              className="input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What happened?"
            />
          </div>
          <div className="modal-actions">
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add note"}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : events.length === 0 ? (
        <div className="empty-state">No events yet</div>
      ) : (
        <ul className="log-list">
          {events.map((event) => (
            <li key={event.id} className="log-item">
              <div>
                <div className="log-title">
                  {typeLabels[event.type] || event.type}
                </div>
                <div className="helper-text">
                  {event.actor_username || "system"}
                </div>
                {event.payload?.text ? (
                  <div className="helper-text">{event.payload.text}</div>
                ) : null}
                {event.payload?.reason ? (
                  <div className="helper-text">Reason: {event.payload.reason}</div>
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

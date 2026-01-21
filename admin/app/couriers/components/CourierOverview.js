"use client";

import { can } from "../../../lib/rbac";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function CourierOverview({ courier, role, onBlockToggle }) {
  const canBlock = can("block", role);
  const formatRating = (item) =>
    item.rating_avg
      ? `${Number(item.rating_avg).toFixed(1)} (${item.rating_count || 0})`
      : "-";

  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">Overview</div>
        <div className="profile-row">
          <span className="muted">Name</span>
          <span>{courier.username || courier.tg_id || `Courier #${courier.id}`}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Phone</span>
          <span>{courier.phone || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">TG</span>
          <span>{courier.tg_id || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Status</span>
          <span>{courier.user_status || "active"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Online</span>
          <span>{courier.is_active ? "online" : "offline"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Rating</span>
          <span>{formatRating(courier)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Created</span>
          <span>{formatDate(courier.created_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Updated</span>
          <span>{formatDate(courier.updated_at)}</span>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">Actions</div>
        <div className="action-grid">
          <button
            className="button"
            type="button"
            onClick={onBlockToggle}
            disabled={!canBlock}
          >
            {courier.user_status === "blocked" ? "Unblock" : "Block"}
          </button>
          {!canBlock ? (
            <div className="helper-text">Insufficient permissions</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
"use client";

import { can } from "../../../lib/rbac";

export default function OutletOverview({ outlet, role, onStatusChange }) {
  const canEdit = can("edit", role);

  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">Overview</div>
        <div className="profile-row">
          <span className="muted">Name</span>
          <span>{outlet.name}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Partner</span>
          <span>{outlet.partner_name || outlet.partner_id || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Type</span>
          <span>{outlet.type}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Address</span>
          <span>{outlet.address || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Status</span>
          <span>{outlet.status || "open"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Hours</span>
          <span>{outlet.hours || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Delivery zone</span>
          <span>{outlet.delivery_zone || "-"}</span>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">Actions</div>
        <div className="action-grid">
          <button
            className="button"
            type="button"
            disabled={!canEdit}
            onClick={() => onStatusChange(outlet.status === "open" ? "closed" : "open")}
          >
            {outlet.status === "open" ? "Close" : "Open"}
          </button>
          <button
            className="button danger"
            type="button"
            disabled={!canEdit}
            onClick={() => onStatusChange("blocked")}
          >
            Block
          </button>
          {!canEdit ? (
            <div className="helper-text">Insufficient permissions</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
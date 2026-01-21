"use client";

import { can } from "../../../lib/rbac";

export default function PartnerOverview({ partner, role, onBlockToggle }) {
  const canBlock = can("block", role);

  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">Overview</div>
        <div className="profile-row">
          <span className="muted">Name</span>
          <span>{partner.name}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Manager</span>
          <span>{partner.manager || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Outlets</span>
          <span>{partner.outlets_count}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Status</span>
          <span>{partner.status || "active"}</span>
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
            {partner.status === "blocked" ? "Unblock" : "Block"}
          </button>
          {!canBlock ? (
            <div className="helper-text">Insufficient permissions</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
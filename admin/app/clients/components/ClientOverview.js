"use client";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function ClientOverview({
  client,
  metrics,
  onEdit,
  onBlockToggle,
  loading,
  primaryAddress,
  lastPromo,
  onManageAddresses,
  onViewPromos
}) {
  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">Client details</div>
        <div className="profile-row">
          <span className="muted">Name</span>
          <span>{client.name || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Phone</span>
          <span>{client.phone || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Status</span>
          <span>{client.status || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">User ID</span>
          <span>{client.id}</span>
        </div>
        <div className="profile-row">
          <span className="muted">TG ID</span>
          <span>{client.tg_id || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">TG Username</span>
          <span>{client.username || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Created</span>
          <span>{formatDate(client.created_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Updated</span>
          <span>{formatDate(client.updated_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Last order</span>
          <span>{formatDate(metrics.lastOrderAt)}</span>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">Metrics</div>
        {loading ? (
          <div className="skeleton-block" />
        ) : (
          <div className="cards compact">
            <div className="card">
              <div className="helper-text">Orders</div>
              <div className="card-value">{metrics.ordersCount}</div>
            </div>
            <div className="card">
              <div className="helper-text">Total spent</div>
              <div className="card-value">{metrics.totalSpent} sum</div>
            </div>
            <div className="card">
              <div className="helper-text">Avg check</div>
              <div className="card-value">{metrics.avgCheck} sum</div>
            </div>
          </div>
        )}
      </section>

      <section className="card profile-card">
        <div className="profile-title">Support tools</div>
        <div className="profile-row">
          <span className="muted">Primary address</span>
          <span>{primaryAddress?.address_text || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Last promo</span>
          <span>{lastPromo ? `${lastPromo.code} (${lastPromo.status})` : "-"}</span>
        </div>
        <div className="table-actions">
          <button className="action-link" type="button" onClick={onManageAddresses}>
            Manage addresses
          </button>
          <button className="action-link" type="button" onClick={onViewPromos}>
            View promos
          </button>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">Actions</div>
        <div className="action-grid">
          <button className="button" type="button" onClick={onEdit}>
            Edit
          </button>
          <button className="button" type="button" onClick={onBlockToggle}>
            {client.status === "active" ? "Block" : "Unblock"}
          </button>
        </div>
      </section>
    </div>
  );
}
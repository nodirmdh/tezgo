"use client";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function UserActivity({ data, loading, error }) {
  return (
    <section className="card profile-card">
      <div className="profile-title">Activity / Logs</div>
      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <ul className="log-list">
          {data.map((item) => (
            <li key={item.id} className="log-item">
              <div>
                <div className="log-title">{item.event_type}</div>
                <div className="helper-text">{item.details || "-"}</div>
              </div>
              <div className="helper-text">{formatDate(item.created_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

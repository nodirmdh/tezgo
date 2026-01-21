"use client";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const parseJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const buildDiff = (before, after) => {
  if (!before && !after) return "-";
  if (typeof before !== "object" || typeof after !== "object") {
    return `${String(before ?? "-")} → ${String(after ?? "-")}`;
  }
  const keys = new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])]);
  const changes = [];
  keys.forEach((key) => {
    if (String(before?.[key]) !== String(after?.[key])) {
      changes.push(`${key}: ${before?.[key] ?? "-"} → ${after?.[key] ?? "-"}`);
    }
  });
  return changes.length ? changes.join("; ") : "-";
};

export default function AuditLogTable({ data, loading, error }) {
  return (
    <section className="card profile-card">
      <div className="profile-title">Audit</div>
      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Reason</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const before = parseJson(item.before_json);
              const after = parseJson(item.after_json);
              return (
                <tr key={item.id}>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{item.actor_name || item.actor_tg_id || "-"}</td>
                  <td>{item.action}</td>
                  <td>{item.reason || "-"}</td>
                  <td className="mono">{buildDiff(before, after)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

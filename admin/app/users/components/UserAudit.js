"use client";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const parseJson = (value) => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export default function UserAudit({ data, loading, error }) {
  return (
    <section className="card profile-card">
      <div className="profile-title">Audit</div>
      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <div className="audit-list">
          {data.map((item) => (
            <div key={item.id} className="audit-card">
              <div className="audit-header">
                <div>
                  <div className="audit-title">{item.action}</div>
                  <div className="helper-text">Actor: {item.actor}</div>
                </div>
                <div className="helper-text">{formatDate(item.created_at)}</div>
              </div>
              <div className="audit-body">
                <div>
                  <div className="helper-text">Before</div>
                  <pre className="audit-code">
                    {JSON.stringify(parseJson(item.before_json), null, 2) || "-"}
                  </pre>
                </div>
                <div>
                  <div className="helper-text">After</div>
                  <pre className="audit-code">
                    {JSON.stringify(parseJson(item.after_json), null, 2) || "-"}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

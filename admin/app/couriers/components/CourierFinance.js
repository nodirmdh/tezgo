"use client";

export default function CourierFinance({ data, loading, error }) {
  return (
    <section className="card profile-card">
      <div className="profile-title">Finance</div>
      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : (
        <>
          <div className="cards">
            {data.summary.map((item) => (
              <div key={item.label || item.type} className="card">
                <div style={{ color: "#64748B", fontSize: "13px" }}>
                  {item.label || item.type}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 600, marginTop: "6px" }}>
                  {item.value ?? item.amount ?? "-"}
                </div>
              </div>
            ))}
          </div>
          {data.transactions.length === 0 ? (
            <div className="empty-state">No data yet</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((row) => (
                  <tr key={row.id ?? row.title}>
                    <td>{row.title}</td>
                    <td>{row.amount}</td>
                    <td>
                      <span className="badge">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
"use client";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function UserFinance({ data, loading, error }) {
  return (
    <section className="card profile-card">
      <div className="profile-title">Р¤РёРЅР°РЅСЃС‹</div>
      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : (
        <>
          <div className="cards compact">
            {data.summary.map((item) => (
              <div key={item.label} className="card">
                <div className="helper-text">{item.label}</div>
                <div className="card-value">{item.value} СЃСѓРј</div>
              </div>
            ))}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>РўСЂР°РЅР·Р°РєС†РёСЏ</th>
                <th>РЎСѓРјРјР°</th>
                <th>РЎС‚Р°С‚СѓСЃ</th>
                <th>Р”Р°С‚Р°</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.amount} СЃСѓРј</td>
                  <td>
                    <span className="badge">{item.status}</span>
                  </td>
                  <td>{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

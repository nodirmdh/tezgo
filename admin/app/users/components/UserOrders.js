"use client";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function UserOrders({
  data,
  filters,
  onFilterChange,
  onPageChange,
  loading,
  error
}) {
  const totalPages = Math.max(
    1,
    Math.ceil((data.total || 0) / (data.page_size || 10))
  );

  return (
    <section className="card profile-card">
      <div className="profile-title">РСЃС‚РѕСЂРёСЏ Р·Р°РєР°Р·РѕРІ</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder="РџРѕРёСЃРє РїРѕ orderId"
            value={filters.q}
            onChange={(event) =>
              onFilterChange({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              onFilterChange({ ...filters, status: event.target.value, page: 1 })
            }
          >
            <option value="">Р’СЃРµ СЃС‚Р°С‚СѓСЃС‹</option>
            <option value="accepted_by_system">РџСЂРёРЅСЏС‚ СЃРёСЃС‚РµРјРѕР№</option>
            <option value="accepted_by_restaurant">РџСЂРёРЅСЏС‚ СЂРµСЃС‚РѕСЂР°РЅРѕРј</option>
            <option value="ready_for_pickup">Р“РѕС‚РѕРІ Рє РІС‹РґР°С‡Рµ</option>
            <option value="picked_up">РљСѓСЂСЊРµСЂ Р·Р°Р±СЂР°Р»</option>
            <option value="delivered">Р”РѕСЃС‚Р°РІРёР»</option>
          </select>
        </div>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>OrderId</th>
              <th>Р”Р°С‚Р°/РІСЂРµРјСЏ</th>
              <th>Р РµСЃС‚РѕСЂР°РЅ</th>
              <th>РЎСѓРјРјР°</th>
              <th>РЎС‚Р°С‚СѓСЃ</th>
              <th>РљСѓСЂСЊРµСЂ</th>
              <th>РђРґСЂРµСЃ</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{formatDate(order.created_at)}</td>
                <td>{order.outlet_name || "-"}</td>
                <td>{order.total_amount ? `${order.total_amount} СЃСѓРј` : "-"}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
                <td>{order.courier_user_id ?? "-"}</td>
                <td>{order.delivery_address ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <button
          className="button"
          type="button"
          onClick={() => onPageChange(Math.max(1, filters.page - 1))}
          disabled={filters.page <= 1}
        >
          РќР°Р·Р°Рґ
        </button>
        <div className="helper-text">
          РЎС‚СЂР°РЅРёС†Р° {filters.page} РёР· {totalPages}
        </div>
        <button
          className="button"
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, filters.page + 1))}
          disabled={filters.page >= totalPages}
        >
          Р’РїРµСЂРµРґ
        </button>
      </div>
    </section>
  );
}

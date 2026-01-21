"use client";

import Link from "next/link";

const statusOptions = [
  "",
  "accepted_by_system",
  "accepted_by_restaurant",
  "ready_for_pickup",
  "picked_up",
  "delivered",
  "cancelled"
];

export default function OutletOrders({
  data,
  filters,
  loading,
  error,
  onFilterChange,
  onPageChange
}) {
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10)));

  return (
    <section className="card profile-card">
      <div className="profile-title">Orders</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder="Search by orderId"
            value={filters.q}
            onChange={(event) =>
              onFilterChange({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                status: event.target.value,
                page: 1
              })
            }
          >
            <option value="">All statuses</option>
            {statusOptions
              .filter((item) => item)
              .map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
          </select>
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.items.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{order.created_at}</td>
                <td>{order.client_phone || order.client_name || "-"}</td>
                <td>{order.total_amount ? `${order.total_amount} sum` : "-"}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
                <td>{order.delivery_address || "-"}</td>
                <td>
                  <Link className="action-link" href={`/orders/${order.id}`}>
                    Open order
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <button
          className="button"
          type="button"
          disabled={filters.page <= 1}
          onClick={() => onPageChange(Math.max(1, filters.page - 1))}
        >
          Back
        </button>
        <div className="helper-text">
          Page {filters.page} of {totalPages}
        </div>
        <button
          className="button"
          type="button"
          disabled={filters.page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, filters.page + 1))}
        >
          Next
        </button>
      </div>
    </section>
  );
}
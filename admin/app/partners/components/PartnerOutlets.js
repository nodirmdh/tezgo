"use client";

import Link from "next/link";

export default function PartnerOutlets({
  data,
  filters,
  loading,
  error,
  onPageChange
}) {
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10)));

  return (
    <section className="card profile-card">
      <div className="profile-title">Outlets</div>
      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.items.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Outlet</th>
              <th>Type</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((outlet) => (
              <tr key={outlet.id}>
                <td>{outlet.name}</td>
                <td>{outlet.type}</td>
                <td>{outlet.address || "-"}</td>
                <td>
                  <span className="badge">{outlet.status || "open"}</span>
                </td>
                <td>
                  <Link className="action-link" href={`/outlets/${outlet.id}`}>
                    View
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
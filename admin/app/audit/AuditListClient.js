"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../components/Toast";
import { apiJson } from "../../lib/api/client";

const entityOptions = [
  { value: "", label: "All entities" },
  { value: "user", label: "user" },
  { value: "client", label: "client" },
  { value: "courier", label: "courier" },
  { value: "partner", label: "partner" },
  { value: "outlet", label: "outlet" },
  { value: "order", label: "order" },
  { value: "promo", label: "promo" }
];

export default function AuditListClient() {
  const [filters, setFilters] = useState({
    entity_type: "",
    actor_id: "",
    date_from: "",
    date_to: "",
    page: 1,
    limit: 20
  });
  const [data, setData] = useState({ items: [], page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 20))),
    [data.total, data.limit]
  );

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== "" && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {})
    ).toString();
    const result = await apiJson(`/api/audit?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchAudit, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="toolbar">
        <div className="toolbar-actions">
          <select
            className="select"
            value={filters.entity_type}
            onChange={(event) =>
              setFilters({ ...filters, entity_type: event.target.value, page: 1 })
            }
          >
            {entityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Actor user ID"
            value={filters.actor_id}
            onChange={(event) =>
              setFilters({ ...filters, actor_id: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            type="date"
            value={filters.date_from}
            onChange={(event) =>
              setFilters({ ...filters, date_from: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            type="date"
            value={filters.date_to}
            onChange={(event) =>
              setFilters({ ...filters, date_to: event.target.value, page: 1 })
            }
          />
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="form-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Timestamp</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.id}>
                <td>{row.entity_type}</td>
                <td>{row.entity_id}</td>
                <td>{row.action}</td>
                <td>{row.actor_user_id || "-"}</td>
                <td>{row.created_at}</td>
                <td>
                  <details>
                    <summary>View</summary>
                    <pre className="code-block">
                      {JSON.stringify(
                        {
                          before: row.before_json ? JSON.parse(row.before_json) : null,
                          after: row.after_json ? JSON.parse(row.after_json) : null
                        },
                        null,
                        2
                      )}
                    </pre>
                  </details>
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
          onClick={() =>
            setFilters({ ...filters, page: Math.max(1, filters.page - 1) })
          }
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
          onClick={() =>
            setFilters({
              ...filters,
              page: Math.min(totalPages, filters.page + 1)
            })
          }
        >
          Next
        </button>
      </div>
    </section>
  );
}
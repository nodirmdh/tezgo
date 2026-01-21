"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "open", label: "open" },
  { value: "closed", label: "closed" },
  { value: "blocked", label: "blocked" }
];

export default function OutletListClient() {
  const [filters, setFilters] = useState({
    q: "",
    type: "",
    status: "",
    partner_id: "",
    page: 1,
    limit: 10
  });
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, dialog } = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))),
    [data.total, data.limit]
  );

  const fetchOutlets = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: filters.q,
      type: filters.type,
      status: filters.status,
      partner_id: filters.partner_id,
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/outlets/list?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchOutlets, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleStatusToggle = async (outlet, status) => {
    confirm({
      title: `Set status to ${status}?`,
      description: "Status will be updated immediately after confirmation.",
      onConfirm: async () => {
        const result = await apiJson(`/api/outlets/${outlet.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status })
        });
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "Status updated" });
        fetchOutlets();
      }
    });
  };

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder="Search outlet"
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            placeholder="Partner ID"
            value={filters.partner_id}
            onChange={(event) =>
              setFilters({ ...filters, partner_id: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.type}
            onChange={(event) =>
              setFilters({ ...filters, type: event.target.value, page: 1 })
            }
          >
            <option value="">All types</option>
            <option value="restaurant">restaurant</option>
            <option value="shop">shop</option>
          </select>
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value, page: 1 })
            }
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="form-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Outlet</th>
              <th>Partner</th>
              <th>Address</th>
              <th>Status</th>
              <th>Open/Close</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((outlet) => (
              <tr key={outlet.id}>
                <td>{outlet.name}</td>
                <td>{outlet.partner_name || "-"}</td>
                <td>{outlet.address || "-"}</td>
                <td>
                  <span className="badge">{outlet.status || "open"}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="action-link"
                      type="button"
                      onClick={() =>
                        handleStatusToggle(outlet, outlet.status === "open" ? "closed" : "open")
                      }
                    >
                      {outlet.status === "open" ? "Close" : "Open"}
                    </button>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleStatusToggle(outlet, "blocked")}
                    >
                      Block
                    </button>
                  </div>
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
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "active" },
  { value: "blocked", label: "blocked" }
];

export default function PartnerListClient() {
  const [filters, setFilters] = useState({ q: "", status: "", page: 1, limit: 10 });
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, dialog } = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))),
    [data.total, data.limit]
  );

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: filters.q,
      status: filters.status,
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/partners/list?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchPartners, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleBlockToggle = async (partner) => {
    const nextStatus = partner.status === "blocked" ? "active" : "blocked";
    confirm({
      title: nextStatus === "blocked" ? "Block partner?" : "Unblock partner?",
      description: "Status will be updated immediately after confirmation.",
      onConfirm: async () => {
        const result = await apiJson(`/api/partners/${partner.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "Status updated" });
        fetchPartners();
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
            placeholder="Search partner"
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value, page: 1 })
            }
          />
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
              <th>Partner</th>
              <th>Status</th>
              <th>Outlets</th>
              <th>Manager</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((partner) => (
              <tr key={partner.id}>
                <td>{partner.name}</td>
                <td>
                  <span className="badge">{partner.status || "active"}</span>
                </td>
                <td>{partner.outlets_count}</td>
                <td>{partner.manager || "-"}</td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/partners/${partner.id}`}>
                      View
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleBlockToggle(partner)}
                    >
                      {partner.status === "blocked" ? "Unblock" : "Block"}
                    </button>
                  </div>
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
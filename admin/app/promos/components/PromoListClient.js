"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";

const statusOptions = [
  { value: "", label: "All" },
  { value: "1", label: "active" },
  { value: "0", label: "inactive" }
];

export default function PromoListClient() {
  const [filters, setFilters] = useState({ q: "", is_active: "", page: 1, limit: 10 });
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, dialog } = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))),
    [data.total, data.limit]
  );

  const fetchPromos = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: filters.q,
      is_active: filters.is_active
    }).toString();
    const result = await apiJson(`/api/promos?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    const items = result.data || [];
    const page = filters.page;
    const limit = filters.limit;
    const start = (page - 1) * limit;
    const pageItems = items.slice(start, start + limit);
    setData({ items: pageItems, page, limit, total: items.length });
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchPromos, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleToggle = (promo) => {
    const nextStatus = promo.is_active ? 0 : 1;
    confirm({
      title: nextStatus ? "Activate promo?" : "Deactivate promo?",
      description: "Status will be updated immediately after confirmation.",
      onConfirm: async () => {
        const result = await apiJson(`/api/promos/${promo.id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: nextStatus })
        });
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "Status updated" });
        fetchPromos();
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
            placeholder="Search by code"
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.is_active}
            onChange={(event) =>
              setFilters({ ...filters, is_active: event.target.value, page: 1 })
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
              <th>Code</th>
              <th>Discount</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((promo) => (
              <tr key={promo.id}>
                <td>{promo.code}</td>
                <td>{promo.discount_percent}%</td>
                <td>
                  {promo.used_count}/{promo.max_uses}
                </td>
                <td>
                  <span className="badge">
                    {promo.is_active ? "active" : "inactive"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/promos/${promo.id}`}>
                      View
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleToggle(promo)}
                    >
                      {promo.is_active ? "Deactivate" : "Activate"}
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
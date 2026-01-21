"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { normalizeRole } from "../../../lib/rbac";
import { apiJson } from "../../../lib/api/client";

const availabilityOptions = [
  { value: "", label: "All" },
  { value: "true", label: "available" },
  { value: "false", label: "unavailable" }
];

const sortOptions = [
  { value: "title:asc", label: "Title A-Z" },
  { value: "title:desc", label: "Title Z-A" },
  { value: "current_price:asc", label: "Price low" },
  { value: "current_price:desc", label: "Price high" },
  { value: "updatedAt:desc", label: "Recently updated" }
];

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" type="button" onClick={onClose}>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function OutletMenuProducts({ outletId, role }) {
  const [filters, setFilters] = useState({
    search: "",
    available: "",
    sort: sortOptions[0].value,
    page: 1,
    limit: 20
  });
  const [data, setData] = useState({ items: [], pageInfo: { page: 1, limit: 20, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { confirm, dialog } = useConfirm();

  const normalizedRole = normalizeRole(role);
  const canEditPrice = normalizedRole === "admin";
  const canEditAvailability = normalizedRole === "admin" || normalizedRole === "operator";

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.pageInfo.total || 0) / (data.pageInfo.limit || 20))),
    [data]
  );

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      search: filters.search,
      available: filters.available,
      page: String(filters.page),
      limit: String(filters.limit),
      sort: filters.sort
    }).toString();
    const result = await apiJson(`/api/outlets/${outletId}/items?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchItems, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const openEdit = (item) => {
    setEditing({
      ...item,
      basePrice: item.basePrice,
      isAvailable: item.isAvailable ? 1 : 0,
      stock: item.stock ?? "",
      reason: ""
    });
  };

  const openHistory = async (item) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    const result = await apiJson(
      `/api/outlets/${outletId}/items/${item.itemId}/price-history`
    );
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      setHistoryLoading(false);
      return;
    }
    setHistory(result.data);
    setHistoryLoading(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editing) return;
    const payload = {};
    if (canEditPrice && editing.basePrice !== "") {
      payload.basePrice = Number(editing.basePrice);
      if (editing.reason) {
        payload.reason = editing.reason;
      }
    }
    if (canEditAvailability) {
      payload.isAvailable = Number(editing.isAvailable) === 1;
      payload.stock = editing.stock === "" ? null : Number(editing.stock);
    }
    const result = await apiJson(
      `/api/outlets/${outletId}/items/${editing.itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      }
    );
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Item updated" });
    setEditing(null);
    fetchItems();
  };

  const handleToggleAvailability = (item) => {
    if (!canEditAvailability) return;
    confirm({
      title: item.isAvailable ? "Mark unavailable?" : "Mark available?",
      description: "Availability will be updated immediately.",
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/items/${item.itemId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ isAvailable: !item.isAvailable })
          }
        );
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "Availability updated" });
        fetchItems();
      }
    });
  };

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="profile-title">Menu / Products</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder="Search title or SKU"
            value={filters.search}
            onChange={(event) =>
              setFilters({ ...filters, search: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.available}
            onChange={(event) =>
              setFilters({ ...filters, available: event.target.value, page: 1 })
            }
          >
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.sort}
            onChange={(event) =>
              setFilters({ ...filters, sort: event.target.value, page: 1 })
            }
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.items.length === 0 ? (
        <div className="empty-state">No items yet</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Base price</th>
              <th>Current price</th>
              <th>Availability</th>
              <th>Stock</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.itemId}>
                <td>
                  <div className="table-actions">
                    <span>{item.title}</span>
                    {item.activeCampaign ? (
                      <span className="badge">SALE</span>
                    ) : null}
                  </div>
                  {item.activeCampaign ? (
                    <div className="helper-text">
                      {item.activeCampaign.title}
                    </div>
                  ) : null}
                </td>
                <td>{item.category || "-"}</td>
                <td>{item.basePrice}</td>
                <td>{item.currentPrice}</td>
                <td>
                  <span className="badge">
                    {item.isAvailable ? "available" : "unavailable"}
                  </span>
                </td>
                <td>{item.stock ?? "-"}</td>
                <td>{item.updatedAt || "-"}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => openEdit(item)}
                      disabled={!canEditAvailability && !canEditPrice}
                    >
                      Edit
                    </button>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => openHistory(item)}
                    >
                      History
                    </button>
                    {canEditAvailability ? (
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                      >
                        {item.isAvailable ? "Disable" : "Enable"}
                      </button>
                    ) : null}
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
            setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })
          }
        >
          Next
        </button>
      </div>

      <Modal
        open={Boolean(editing)}
        title="Edit item"
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <form className="form-grid" onSubmit={handleSave}>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="editBasePrice">Base price</label>
                <input
                  id="editBasePrice"
                  className="input"
                  value={editing.basePrice}
                  onChange={(event) =>
                    setEditing({ ...editing, basePrice: event.target.value })
                  }
                  disabled={!canEditPrice}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="editStock">Stock</label>
                <input
                  id="editStock"
                  className="input"
                  value={editing.stock}
                  onChange={(event) =>
                    setEditing({ ...editing, stock: event.target.value })
                  }
                  disabled={!canEditAvailability}
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="editAvailability">Availability</label>
                <select
                  id="editAvailability"
                  className="select"
                  value={editing.isAvailable}
                  onChange={(event) =>
                    setEditing({ ...editing, isAvailable: event.target.value })
                  }
                  disabled={!canEditAvailability}
                >
                  <option value={1}>available</option>
                  <option value={0}>unavailable</option>
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="editReason">Reason</label>
                <input
                  id="editReason"
                  className="input"
                  value={editing.reason}
                  onChange={(event) =>
                    setEditing({ ...editing, reason: event.target.value })
                  }
                  disabled={!canEditPrice}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="button" type="submit">
                Save
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={historyOpen} title="Price history" onClose={() => setHistoryOpen(false)}>
        {historyLoading ? (
          <div className="skeleton-block" />
        ) : history.length === 0 ? (
          <div className="empty-state">No history yet</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Old</th>
                <th>New</th>
                <th>Reason</th>
                <th>Changed at</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{row.old_price}</td>
                  <td>{row.new_price}</td>
                  <td>{row.reason || "-"}</td>
                  <td>{row.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </section>
  );
}
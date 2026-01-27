"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { normalizeRole } from "../../../lib/rbac";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

const availabilityOptions = [
  { value: "", labelKey: "outlets.menu.filters.all" },
  { value: "true", labelKey: "outlets.menu.filters.available" },
  { value: "false", labelKey: "outlets.menu.filters.unavailable" }
];

const sortOptions = [
  { value: "title:asc", labelKey: "outlets.menu.sort.titleAsc" },
  { value: "title:desc", labelKey: "outlets.menu.sort.titleDesc" },
  { value: "current_price:asc", labelKey: "outlets.menu.sort.priceLow" },
  { value: "current_price:desc", labelKey: "outlets.menu.sort.priceHigh" },
  { value: "updatedAt:desc", labelKey: "outlets.menu.sort.updated" }
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
  const { t } = useLocale();
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
  const [creating, setCreating] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { confirm, dialog } = useConfirm();

  const normalizedRole = normalizeRole(role);
  const canManageItems = normalizedRole === "admin";
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
      title: item.title ?? "",
      category: item.category ?? "",
      sku: item.sku ?? "",
      description: item.description ?? "",
      photoUrl: item.photoUrl ?? "",
      weightGrams: item.weightGrams ?? "",
      basePrice: item.basePrice,
      isAvailable: item.isAvailable ? 1 : 0,
      stock: item.stock ?? "",
      reason: "",
      unavailableReason: item.unavailableReason ?? "",
      unavailableUntil: item.unavailableUntil ?? ""
    });
  };

  const openCreate = () => {
    setCreating({
      title: "",
      category: "",
      sku: "",
      description: "",
      photoUrl: "",
      weightGrams: "",
      basePrice: "",
      isAvailable: 1,
      stock: "",
      unavailableReason: "",
      unavailableUntil: ""
    });
  };

  const openHistory = async (item) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    const result = await apiJson(
      `/api/outlets/${outletId}/items/${item.itemId}/price-history`
    );
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
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
    if (canManageItems) {
      if (editing.title.trim() !== "") {
        payload.title = editing.title.trim();
      }
      if (editing.category !== "") {
        payload.category = editing.category;
      }
      if (editing.sku !== "") {
        payload.sku = editing.sku;
      }
      if (editing.description !== "") {
        payload.description = editing.description;
      }
      if (editing.photoUrl !== "") {
        payload.photoUrl = editing.photoUrl;
      }
      if (editing.weightGrams !== "") {
        payload.weightGrams = Number(editing.weightGrams);
      }
    }
    if (canEditPrice && editing.basePrice !== "") {
      payload.basePrice = Number(editing.basePrice);
      if (editing.reason) {
        payload.reason = editing.reason;
      }
    }
    if (canEditAvailability) {
      payload.isAvailable = Number(editing.isAvailable) === 1;
      payload.stock = editing.stock === "" ? null : Number(editing.stock);
      if (!payload.isAvailable && !editing.unavailableReason.trim()) {
        setToast({ type: "error", message: t("outlets.menu.validation.reasonRequired") });
        return;
      }
      payload.unavailableReason = editing.unavailableReason || null;
      payload.unavailableUntil = editing.unavailableUntil || null;
    }
    const result = await apiJson(
      `/api/outlets/${outletId}/items/${editing.itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      }
    );
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("outlets.menu.toasts.updated") });
    setEditing(null);
    fetchItems();
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!creating) return;
    if (!creating.title.trim() || creating.basePrice === "") {
      setToast({ type: "error", message: t("outlets.menu.validation.required") });
      return;
    }
    if (Number(creating.isAvailable) === 0 && !creating.unavailableReason.trim()) {
      setToast({ type: "error", message: t("outlets.menu.validation.reasonRequired") });
      return;
    }
    const payload = {
      title: creating.title.trim(),
      category: creating.category || null,
      sku: creating.sku || null,
      description: creating.description || null,
      photoUrl: creating.photoUrl || null,
      weightGrams: creating.weightGrams === "" ? null : Number(creating.weightGrams),
      basePrice: Number(creating.basePrice),
      isAvailable: Number(creating.isAvailable) === 1,
      stock: creating.stock === "" ? null : Number(creating.stock),
      unavailableReason: creating.unavailableReason || null,
      unavailableUntil: creating.unavailableUntil || null
    };
    const result = await apiJson(`/api/outlets/${outletId}/items`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("outlets.menu.toasts.created") });
    setCreating(null);
    fetchItems();
  };

  const handleDelete = (item) => {
    if (!canManageItems) return;
    confirm({
      title: t("outlets.menu.confirm.deleteTitle"),
      description: t("outlets.menu.confirm.deleteDescription"),
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/items/${item.itemId}`,
          { method: "DELETE" }
        );
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.menu.toasts.deleted") });
        fetchItems();
      }
    });
  };

  const handleToggleAvailability = (item) => {
    if (!canEditAvailability) return;
    confirm({
      title: item.isAvailable
        ? t("outlets.menu.confirm.unavailable")
        : t("outlets.menu.confirm.available"),
      description: t("outlets.menu.confirm.description"),
      onConfirm: async () => {
        let reason = null;
        if (item.isAvailable) {
          reason = window.prompt(t("outlets.menu.prompts.unavailableReason"));
          if (!reason) {
            setToast({ type: "error", message: t("outlets.menu.validation.reasonRequired") });
            return;
          }
        }
        const result = await apiJson(
          `/api/outlets/${outletId}/items/${item.itemId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              isAvailable: !item.isAvailable,
              unavailableReason: reason,
              unavailableUntil: null
            })
          }
        );
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.menu.toasts.availabilityUpdated") });
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
      <div className="profile-title">{t("outlets.menu.title")}</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder={t("outlets.menu.search")}
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
                {t(option.labelKey)}
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
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          {canManageItems ? (
            <button className="button" type="button" onClick={openCreate}>
              {t("outlets.menu.addItem")}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.items.length === 0 ? (
        <div className="empty-state">{t("outlets.menu.empty")}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("outlets.menu.table.title")}</th>
              <th>{t("outlets.menu.table.category")}</th>
              <th>{t("outlets.menu.table.sku")}</th>
              <th>{t("outlets.menu.table.weight")}</th>
              <th>{t("outlets.menu.table.photo")}</th>
              <th>{t("outlets.menu.table.basePrice")}</th>
              <th>{t("outlets.menu.table.currentPrice")}</th>
              <th>{t("outlets.menu.table.availability")}</th>
              <th>{t("outlets.menu.table.stock")}</th>
              <th>{t("outlets.menu.table.updated")}</th>
              <th>{t("orders.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.itemId}>
                <td>
                  <div className="table-actions">
                    <span>{item.title}</span>
                    {item.activeCampaign ? (
                      <span className="badge">{t("outlets.menu.sale")}</span>
                    ) : null}
                  </div>
                  {item.activeCampaign ? (
                    <div className="helper-text">
                      {item.activeCampaign.title}
                    </div>
                  ) : null}
                  {item.description ? (
                    <div className="helper-text">{item.description}</div>
                  ) : null}
                </td>
                <td>{item.category || "-"}</td>
                <td>{item.sku || "-"}</td>
                <td>{item.weightGrams ? `${item.weightGrams} g` : "-"}</td>
                <td>
                  {item.photoUrl ? (
                    <a className="action-link" href={item.photoUrl} target="_blank" rel="noreferrer">
                      {t("outlets.menu.table.photoLink")}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{item.basePrice}</td>
                <td>{item.currentPrice}</td>
                <td>
                  <span className="badge">
                    {item.isAvailable
                      ? t("outlets.menu.filters.available")
                      : t("outlets.menu.filters.unavailable")}
                  </span>
                  {!item.isAvailable && (item.unavailableReason || item.unavailableUntil) ? (
                    <div className="helper-text">
                      {item.unavailableReason || t("outlets.menu.stoplist.noReason")}
                      {item.unavailableUntil ? ` · ${item.unavailableUntil}` : ""}
                    </div>
                  ) : null}
                </td>
                <td>{item.stock ?? "-"}</td>
                <td>{item.updatedAt || "-"}</td>
                <td>
                  <div className="table-actions">
                    <Link
                      className="action-link"
                      href={`/outlets/${outletId}/items/${item.itemId}`}
                    >
                      {t("outlets.menu.profile.open")}
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => openEdit(item)}
                      disabled={!canEditAvailability && !canEditPrice}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => openHistory(item)}
                    >
                      {t("outlets.menu.history")}
                    </button>
                    {canEditAvailability ? (
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                      >
                        {item.isAvailable
                          ? t("outlets.menu.disable")
                          : t("outlets.menu.enable")}
                      </button>
                    ) : null}
                    {canManageItems ? (
                      <button
                        className="action-link danger"
                        type="button"
                        onClick={() => handleDelete(item)}
                      >
                        {t("common.delete")}
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
          {t("common.back")}
        </button>
        <div className="helper-text">
          {t("common.page", { page: filters.page, total: totalPages })}
        </div>
        <button
          className="button"
          type="button"
          disabled={filters.page >= totalPages}
          onClick={() =>
            setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })
          }
        >
          {t("common.next")}
        </button>
      </div>

      <Modal
        open={Boolean(editing)}
        title={t("outlets.menu.editItem")}
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <form className="form-grid" onSubmit={handleSave}>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="editTitle">{t("outlets.menu.form.title")}</label>
                <input
                  id="editTitle"
                  className="input"
                  value={editing.title}
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                  disabled={!canManageItems}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="editCategory">{t("outlets.menu.form.category")}</label>
                <input
                  id="editCategory"
                  className="input"
                  value={editing.category}
                  onChange={(event) =>
                    setEditing({ ...editing, category: event.target.value })
                  }
                  disabled={!canManageItems}
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="editSku">{t("outlets.menu.form.sku")}</label>
                <input
                  id="editSku"
                  className="input"
                  value={editing.sku}
                  onChange={(event) =>
                    setEditing({ ...editing, sku: event.target.value })
                  }
                  disabled={!canManageItems}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="editWeight">{t("outlets.menu.form.weight")}</label>
                <input
                  id="editWeight"
                  type="number"
                  className="input"
                  value={editing.weightGrams}
                  onChange={(event) =>
                    setEditing({ ...editing, weightGrams: event.target.value })
                  }
                  disabled={!canManageItems}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="editPhoto">{t("outlets.menu.form.photoUrl")}</label>
                <input
                  id="editPhoto"
                  className="input"
                  value={editing.photoUrl}
                  onChange={(event) =>
                    setEditing({ ...editing, photoUrl: event.target.value })
                  }
                  disabled={!canManageItems}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="editDescription">{t("outlets.menu.form.description")}</label>
                <textarea
                  id="editDescription"
                  className="textarea"
                  value={editing.description}
                  onChange={(event) =>
                    setEditing({ ...editing, description: event.target.value })
                  }
                  disabled={!canManageItems}
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="editBasePrice">{t("outlets.menu.form.basePrice")}</label>
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
                <label htmlFor="editStock">{t("outlets.menu.form.stock")}</label>
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
                <label htmlFor="editAvailability">{t("outlets.menu.form.availability")}</label>
                <select
                  id="editAvailability"
                  className="select"
                  value={editing.isAvailable}
                  onChange={(event) =>
                    setEditing({ ...editing, isAvailable: event.target.value })
                  }
                  disabled={!canEditAvailability}
                >
                  <option value={1}>{t("outlets.menu.filters.available")}</option>
                  <option value={0}>{t("outlets.menu.filters.unavailable")}</option>
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="editReason">{t("outlets.menu.form.reason")}</label>
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
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="editUnavailableReason">{t("outlets.menu.form.unavailableReason")}</label>
                <input
                  id="editUnavailableReason"
                  className="input"
                  value={editing.unavailableReason}
                  onChange={(event) =>
                    setEditing({ ...editing, unavailableReason: event.target.value })
                  }
                  disabled={!canEditAvailability}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="editUnavailableUntil">{t("outlets.menu.form.unavailableUntil")}</label>
                <input
                  id="editUnavailableUntil"
                  type="datetime-local"
                  className="input"
                  value={editing.unavailableUntil}
                  onChange={(event) =>
                    setEditing({ ...editing, unavailableUntil: event.target.value })
                  }
                  disabled={!canEditAvailability}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="button" type="submit">
                {t("common.save")}
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => setEditing(null)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(creating)}
        title={t("outlets.menu.createItem")}
        onClose={() => setCreating(null)}
      >
        {creating ? (
          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="createTitle">{t("outlets.menu.form.title")}</label>
                <input
                  id="createTitle"
                  className="input"
                  value={creating.title}
                  onChange={(event) =>
                    setCreating({ ...creating, title: event.target.value })
                  }
                />
              </div>
              <div className="auth-field">
                <label htmlFor="createCategory">{t("outlets.menu.form.category")}</label>
                <input
                  id="createCategory"
                  className="input"
                  value={creating.category}
                  onChange={(event) =>
                    setCreating({ ...creating, category: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="createSku">{t("outlets.menu.form.sku")}</label>
                <input
                  id="createSku"
                  className="input"
                  value={creating.sku}
                  onChange={(event) =>
                    setCreating({ ...creating, sku: event.target.value })
                  }
                />
              </div>
              <div className="auth-field">
                <label htmlFor="createWeight">{t("outlets.menu.form.weight")}</label>
                <input
                  id="createWeight"
                  type="number"
                  className="input"
                  value={creating.weightGrams}
                  onChange={(event) =>
                    setCreating({ ...creating, weightGrams: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="createPhoto">{t("outlets.menu.form.photoUrl")}</label>
                <input
                  id="createPhoto"
                  className="input"
                  value={creating.photoUrl}
                  onChange={(event) =>
                    setCreating({ ...creating, photoUrl: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="createDescription">{t("outlets.menu.form.description")}</label>
                <textarea
                  id="createDescription"
                  className="textarea"
                  value={creating.description}
                  onChange={(event) =>
                    setCreating({ ...creating, description: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="createBasePrice">{t("outlets.menu.form.basePrice")}</label>
                <input
                  id="createBasePrice"
                  className="input"
                  value={creating.basePrice}
                  onChange={(event) =>
                    setCreating({ ...creating, basePrice: event.target.value })
                  }
                />
              </div>
              <div className="auth-field">
                <label htmlFor="createStock">{t("outlets.menu.form.stock")}</label>
                <input
                  id="createStock"
                  className="input"
                  value={creating.stock}
                  onChange={(event) =>
                    setCreating({ ...creating, stock: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="createAvailability">{t("outlets.menu.form.availability")}</label>
                <select
                  id="createAvailability"
                  className="select"
                  value={creating.isAvailable}
                  onChange={(event) =>
                    setCreating({ ...creating, isAvailable: event.target.value })
                  }
                >
                  <option value={1}>{t("outlets.menu.filters.available")}</option>
                  <option value={0}>{t("outlets.menu.filters.unavailable")}</option>
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="createUnavailableReason">{t("outlets.menu.form.unavailableReason")}</label>
                <input
                  id="createUnavailableReason"
                  className="input"
                  value={creating.unavailableReason}
                  onChange={(event) =>
                    setCreating({ ...creating, unavailableReason: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="createUnavailableUntil">{t("outlets.menu.form.unavailableUntil")}</label>
                <input
                  id="createUnavailableUntil"
                  type="datetime-local"
                  className="input"
                  value={creating.unavailableUntil}
                  onChange={(event) =>
                    setCreating({ ...creating, unavailableUntil: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="button" type="submit">
                {t("common.create")}
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => setCreating(null)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={historyOpen} title={t("outlets.menu.priceHistory")} onClose={() => setHistoryOpen(false)}>
        {historyLoading ? (
          <div className="skeleton-block" />
        ) : history.length === 0 ? (
          <div className="empty-state">{t("outlets.menu.noHistory")}</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("outlets.menu.historyTable.old")}</th>
                <th>{t("outlets.menu.historyTable.new")}</th>
                <th>{t("outlets.menu.historyTable.reason")}</th>
                <th>{t("outlets.menu.historyTable.changedAt")}</th>
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

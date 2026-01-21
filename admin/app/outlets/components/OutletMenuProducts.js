"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import BulkSelectionTable from "../../components/BulkSelectionTable";
import BulkActionBar from "../../components/BulkActionBar";
import BulkPreviewModal from "../../components/BulkPreviewModal";
import CsvUploadModal from "../../components/CsvUploadModal";
import { normalizeRole } from "../../../lib/rbac";
import { apiJson } from "../../../lib/api/client";
import { bulkUpdateOutletItems } from "../../../lib/api/bulkApi";
import { applyCsvPreview, uploadCsvPreview } from "../../../lib/api/bulkUploadApi";

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

const discountTypes = [
  { value: "percent", label: "percent" },
  { value: "fixed", label: "fixed" },
  { value: "new_price", label: "new_price" }
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkParams, setBulkParams] = useState({});
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [bulkPreviewRows, setBulkPreviewRows] = useState([]);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSummary, setBulkSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvType, setCsvType] = useState("menuPricesAvailability");
  const [csvReason, setCsvReason] = useState("");
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvSummary, setCsvSummary] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvApplying, setCsvApplying] = useState(false);
  const { confirm, dialog } = useConfirm();

  const normalizedRole = normalizeRole(role);
  const canEditPrice = normalizedRole === "admin";
  const canEditAvailability = normalizedRole === "admin" || normalizedRole === "operator";
  const canBulk = canEditPrice || canEditAvailability;
  const canUploadPriceCsv = canEditPrice;
  const canUploadStockCsv = canEditAvailability;

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

  const fetchCampaigns = async () => {
    const result = await apiJson(`/api/outlets/${outletId}/campaigns`);
    if (result.ok) {
      setCampaigns(result.data || []);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [outletId]);

  useEffect(() => {
    const currentIds = new Set(data.items.map((item) => item.itemId));
    setSelectedIds((prev) => prev.filter((id) => currentIds.has(id)));
  }, [data.items]);

  useEffect(() => {
    setBulkReason("");
    setBulkSummary(null);
    if (bulkAction === "setStock") {
      setBulkParams({ stock: "" });
    } else if (bulkAction === "adjustPrice") {
      setBulkParams({ direction: "increase", kind: "percent" });
    } else if (bulkAction === "addToCampaign") {
      setBulkParams({ discount_type: "percent" });
    } else {
      setBulkParams({});
    }
  }, [bulkAction]);

  useEffect(() => {
    if (!canUploadPriceCsv && canUploadStockCsv) {
      setCsvType("menuStock");
    }
  }, [canUploadPriceCsv, canUploadStockCsv]);

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

  const bulkActions = useMemo(() => {
    const actions = [];
    if (canEditAvailability) {
      actions.push({ value: "setAvailability", label: "Set availability" });
      actions.push({ value: "setStock", label: "Set stock" });
    }
    if (canEditPrice) {
      actions.push({ value: "setPrice", label: "Set price" });
      actions.push({ value: "adjustPrice", label: "Adjust price" });
      actions.push({ value: "addToCampaign", label: "Add to campaign" });
    }
    return actions;
  }, [canEditAvailability, canEditPrice]);

  const selectedItems = useMemo(
    () => data.items.filter((item) => selectedIds.includes(item.itemId)),
    [data.items, selectedIds]
  );

  const campaignsById = useMemo(() => {
    const map = new Map();
    campaigns.forEach((campaign) => {
      map.set(campaign.id, campaign);
    });
    return map;
  }, [campaigns]);

  const computeAdjustedPrice = (basePrice, params) => {
    const value = Number(params.value || 0);
    const direction = params.direction || "increase";
    const kind = params.kind || "percent";
    if (!value) return basePrice;
    let next = basePrice;
    if (kind === "percent") {
      const delta = Math.round(basePrice * (value / 100));
      next = direction === "decrease" ? basePrice - delta : basePrice + delta;
    } else {
      next = direction === "decrease" ? basePrice - value : basePrice + value;
    }
    return Math.max(0, Math.round(next));
  };

  const openBulkPreview = () => {
    if (!bulkAction) {
      setToast({ type: "error", message: "Select bulk action" });
      return;
    }
    if (selectedItems.length === 0) {
      setToast({ type: "error", message: "Select items first" });
      return;
    }
    if (bulkAction === "setAvailability" && typeof bulkParams.isAvailable !== "boolean") {
      setToast({ type: "error", message: "Select availability value" });
      return;
    }
    if (bulkAction === "setPrice" && (bulkParams.basePrice === "" || bulkParams.basePrice === undefined)) {
      setToast({ type: "error", message: "Enter base price" });
      return;
    }
    if (bulkAction === "adjustPrice" && !bulkParams.value) {
      setToast({ type: "error", message: "Enter adjustment value" });
      return;
    }
    if (bulkAction === "setStock" && bulkParams.stock === undefined) {
      setToast({ type: "error", message: "Enter stock value or leave blank to clear" });
      return;
    }
    if (bulkAction === "addToCampaign") {
      if (!bulkParams.campaignId) {
        setToast({ type: "error", message: "Select campaign" });
        return;
      }
      if (!bulkParams.discount_type || bulkParams.discount_value === "") {
        setToast({ type: "error", message: "Set discount type and value" });
        return;
      }
    }

    const preview = selectedItems.slice(0, 20).map((item) => {
      const changes = [];
      if (bulkAction === "setAvailability") {
        changes.push({
          label: "Availability",
          from: item.isAvailable ? "available" : "unavailable",
          to: bulkParams.isAvailable ? "available" : "unavailable"
        });
      }
      if (bulkAction === "setPrice") {
        const price = Math.max(0, Math.round(Number(bulkParams.basePrice)));
        changes.push({
          label: "Base price",
          from: item.basePrice,
          to: price
        });
      }
      if (bulkAction === "adjustPrice") {
        const next = computeAdjustedPrice(item.basePrice, bulkParams);
        changes.push({
          label: "Base price",
          from: item.basePrice,
          to: next
        });
      }
      if (bulkAction === "setStock") {
        const nextStock = bulkParams.stock === "" ? null : Number(bulkParams.stock);
        changes.push({
          label: "Stock",
          from: item.stock ?? "-",
          to: nextStock ?? "-"
        });
      }
      if (bulkAction === "addToCampaign") {
        const campaign = campaignsById.get(Number(bulkParams.campaignId));
        const oldLabel = item.activeCampaign
          ? `${item.activeCampaign.title} (${item.activeCampaign.discount_type} ${item.activeCampaign.discount_value})`
          : "-";
        const newLabel = campaign
          ? `${campaign.title} (${bulkParams.discount_type} ${bulkParams.discount_value})`
          : "-";
        changes.push({
          label: "Campaign",
          from: oldLabel,
          to: newLabel
        });
      }
      return { id: item.itemId, title: item.title, changes };
    });
    setBulkPreviewRows(preview);
    setBulkPreviewOpen(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkReason.trim()) {
      setToast({ type: "error", message: "Reason is required" });
      return;
    }
    setBulkSubmitting(true);
    const paramsPayload = { ...bulkParams };
    if (bulkAction === "setAvailability") {
      paramsPayload.isAvailable = Boolean(bulkParams.isAvailable);
    }
    if (bulkAction === "setPrice") {
      paramsPayload.basePrice = Math.max(0, Math.round(Number(bulkParams.basePrice)));
    }
    if (bulkAction === "adjustPrice") {
      paramsPayload.value = Number(bulkParams.value);
    }
    if (bulkAction === "setStock") {
      paramsPayload.stock = bulkParams.stock === "" ? null : Number(bulkParams.stock);
    }
    if (bulkAction === "addToCampaign") {
      paramsPayload.campaignId = Number(bulkParams.campaignId);
      paramsPayload.discount_value = Number(bulkParams.discount_value);
    }

    const result = await bulkUpdateOutletItems({
      outletId,
      action: bulkAction,
      itemIds: selectedIds,
      params: paramsPayload,
      reason: bulkReason.trim()
    });

    setBulkSubmitting(false);
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    const summary = `Bulk action done: ${result.data.successCount} ok, ${result.data.errorCount} errors.`;
    setBulkSummary(summary);
    setToast({ type: "success", message: summary });
    setBulkPreviewOpen(false);
    setSelectedIds([]);
    setBulkReason("");
    fetchItems();
  };

  const csvUploadTypes = useMemo(() => {
    const options = [];
    if (canUploadPriceCsv) {
      options.push({ value: "menuPricesAvailability", label: "Menu: prices & availability" });
    }
    if (canUploadStockCsv) {
      options.push({ value: "menuStock", label: "Menu: stock only" });
    }
    return options;
  }, [canUploadPriceCsv, canUploadStockCsv]);

  const handleCsvUpload = async ({ csvText, type }) => {
    setCsvUploading(true);
    const result = await uploadCsvPreview({
      type,
      csvText,
      contextOutletId: outletId
    });
    setCsvUploading(false);
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setCsvPreview(result.data);
    setCsvSummary(result.data.summary);
  };

  const handleCsvApply = async () => {
    if (!csvPreview?.previewId) return;
    if (!csvReason.trim()) {
      setToast({ type: "error", message: "Reason is required" });
      return;
    }
    setCsvApplying(true);
    const result = await applyCsvPreview({ previewId: csvPreview.previewId, reason: csvReason.trim() });
    setCsvApplying(false);
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    const summary = `CSV applied: ${result.data.successCount} ok, ${result.data.errorCount} errors.`;
    setToast({ type: "success", message: summary });
    setCsvPreview(null);
    setCsvSummary(null);
    setCsvReason("");
    setCsvModalOpen(false);
    fetchItems();
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
          {canBulk ? (
            <button className="button ghost" type="button" onClick={() => setCsvModalOpen(true)}>
              Upload CSV
            </button>
          ) : null}
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

      {canBulk ? (
        <BulkActionBar
          selectedCount={selectedIds.length}
          actions={bulkActions}
          selectedAction={bulkAction}
          onActionChange={setBulkAction}
          onApply={openBulkPreview}
          disabled={bulkSubmitting}
        >
          {bulkAction === "setAvailability" ? (
            <select
              className="select"
              value={bulkParams.isAvailable === undefined ? "" : String(bulkParams.isAvailable)}
              onChange={(event) =>
                setBulkParams({
                  ...bulkParams,
                  isAvailable:
                    event.target.value === "" ? undefined : event.target.value === "true"
                })
              }
            >
              <option value="">Availability</option>
              <option value="true">available</option>
              <option value="false">unavailable</option>
            </select>
          ) : null}
          {bulkAction === "setPrice" ? (
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Base price"
              value={bulkParams.basePrice ?? ""}
              onChange={(event) =>
                setBulkParams({ ...bulkParams, basePrice: event.target.value })
              }
            />
          ) : null}
          {bulkAction === "adjustPrice" ? (
            <>
              <select
                className="select"
                value={bulkParams.direction || "increase"}
                onChange={(event) =>
                  setBulkParams({ ...bulkParams, direction: event.target.value })
                }
              >
                <option value="increase">increase</option>
                <option value="decrease">decrease</option>
              </select>
              <select
                className="select"
                value={bulkParams.kind || "percent"}
                onChange={(event) =>
                  setBulkParams({ ...bulkParams, kind: event.target.value })
                }
              >
                <option value="percent">percent</option>
                <option value="fixed">fixed</option>
              </select>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Value"
                value={bulkParams.value ?? ""}
                onChange={(event) =>
                  setBulkParams({ ...bulkParams, value: event.target.value })
                }
              />
            </>
          ) : null}
          {bulkAction === "setStock" ? (
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Stock (blank = clear)"
              value={bulkParams.stock ?? ""}
              onChange={(event) =>
                setBulkParams({ ...bulkParams, stock: event.target.value })
              }
            />
          ) : null}
          {bulkAction === "addToCampaign" ? (
            <>
              <select
                className="select"
                value={bulkParams.campaignId || ""}
                onChange={(event) =>
                  setBulkParams({ ...bulkParams, campaignId: event.target.value })
                }
              >
                <option value="">Campaign</option>
                {campaigns
                  .filter((campaign) => ["active", "planned"].includes(campaign.status))
                  .map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title} ({campaign.status})
                    </option>
                  ))}
              </select>
              <select
                className="select"
                value={bulkParams.discount_type || "percent"}
                onChange={(event) =>
                  setBulkParams({ ...bulkParams, discount_type: event.target.value })
                }
              >
                {discountTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Discount value"
                value={bulkParams.discount_value ?? ""}
                onChange={(event) =>
                  setBulkParams({ ...bulkParams, discount_value: event.target.value })
                }
              />
            </>
          ) : null}
        </BulkActionBar>
      ) : null}
      {bulkSummary ? <div className="helper-text">{bulkSummary}</div> : null}

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.items.length === 0 ? (
        <div className="empty-state">No items yet</div>
      ) : (
        <BulkSelectionTable
          items={data.items}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          getRowId={(item) => item.itemId}
        >
          {({ headerCheckbox, getRowCheckbox }) => (
            <table className="table">
              <thead>
                <tr>
                  <th>{headerCheckbox}</th>
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
                    <td>{getRowCheckbox(item.itemId)}</td>
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
        </BulkSelectionTable>
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

      <BulkPreviewModal
        open={bulkPreviewOpen}
        title="Preview bulk action"
        warning="This is a bulk change. Please review before confirming."
        previewRows={bulkPreviewRows}
        reason={bulkReason}
        onReasonChange={setBulkReason}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkPreviewOpen(false)}
        confirmDisabled={bulkSubmitting || !bulkReason.trim()}
      />

      <CsvUploadModal
        open={csvModalOpen}
        onClose={() => {
          setCsvModalOpen(false);
          setCsvPreview(null);
          setCsvSummary(null);
          setCsvReason("");
        }}
        uploadTypes={csvUploadTypes}
        selectedType={csvType}
        onTypeChange={setCsvType}
        onUpload={handleCsvUpload}
        onApply={handleCsvApply}
        preview={csvPreview}
        summary={csvSummary}
        reason={csvReason}
        onReasonChange={setCsvReason}
        uploading={csvUploading}
        applying={csvApplying}
      />
    </section>
  );
}

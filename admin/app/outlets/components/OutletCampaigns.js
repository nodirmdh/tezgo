"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import BulkSelectionTable from "../../components/BulkSelectionTable";
import BulkActionBar from "../../components/BulkActionBar";
import BulkPreviewModal from "../../components/BulkPreviewModal";
import { normalizeRole } from "../../../lib/rbac";
import { apiJson } from "../../../lib/api/client";
import { bulkUpdateCampaignItems } from "../../../lib/api/bulkApi";

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

const computeCurrentPrice = (basePrice, discount) => {
  const value = Number(discount.discount_value || 0);
  if (discount.discount_type === "percent") {
    return Math.max(0, Math.round(basePrice * (100 - value) / 100));
  }
  if (discount.discount_type === "fixed") {
    return Math.max(0, basePrice - value);
  }
  if (discount.discount_type === "new_price") {
    return Math.max(0, value);
  }
  return basePrice;
};

export default function OutletCampaigns({ outletId, role }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [campaignModal, setCampaignModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkParams, setBulkParams] = useState({});
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [bulkPreviewRows, setBulkPreviewRows] = useState([]);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSummary, setBulkSummary] = useState(null);
  const { confirm, dialog } = useConfirm();

  const normalizedRole = normalizeRole(role);
  const canManage = normalizedRole === "admin";
  const canBulk = normalizedRole === "admin" || normalizedRole === "operator";

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    const result = await apiJson(`/api/outlets/${outletId}/campaigns`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setCampaigns(result.data || []);
    setLoading(false);
  };

  const fetchMenuItems = async () => {
    const result = await apiJson(`/api/outlets/${outletId}/items?limit=200`);
    if (result.ok) {
      setMenuItems(result.data.items || []);
    }
  };

  const fetchCampaignItems = async (campaignId) => {
    setItemsLoading(true);
    const result = await apiJson(
      `/api/outlets/${outletId}/campaigns/${campaignId}/items`
    );
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      setItemsLoading(false);
      return;
    }
    setItems(result.data || []);
    setItemsLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
    fetchMenuItems();
  }, []);

  const openCampaignModal = (campaign = null) => {
    setCampaignModal({
      id: campaign?.id ?? null,
      title: campaign?.title ?? "",
      start_at: campaign?.start_at ?? "",
      end_at: campaign?.end_at ?? ""
    });
  };

  const saveCampaign = async (event) => {
    event.preventDefault();
    if (!campaignModal?.title) {
      setToast({ type: "error", message: "Title is required" });
      return;
    }
    const payload = {
      title: campaignModal.title,
      start_at: campaignModal.start_at || null,
      end_at: campaignModal.end_at || null
    };
    const result = campaignModal.id
      ? await apiJson(`/api/outlets/${outletId}/campaigns/${campaignModal.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        })
      : await apiJson(`/api/outlets/${outletId}/campaigns`, {
          method: "POST",
          body: JSON.stringify(payload)
        });

    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Campaign saved" });
    setCampaignModal(null);
    fetchCampaigns();
  };

  const handleActivate = (campaign) => {
    confirm({
      title: "Activate campaign?",
      description: "Campaign will become active immediately.",
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/campaigns/${campaign.id}/activate`,
          { method: "POST" }
        );
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "Campaign activated" });
        fetchCampaigns();
      }
    });
  };

  const handleEnd = (campaign) => {
    confirm({
      title: "End campaign?",
      description: "Campaign will be ended immediately.",
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/campaigns/${campaign.id}/end`,
          { method: "POST" }
        );
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "Campaign ended" });
        fetchCampaigns();
      }
    });
  };

  const openCampaignItems = async (campaign) => {
    setSelectedCampaign(campaign);
    fetchCampaignItems(campaign.id);
  };

  useEffect(() => {
    const currentIds = new Set(items.map((item) => item.itemId));
    setSelectedIds((prev) => prev.filter((id) => currentIds.has(id)));
  }, [items]);

  useEffect(() => {
    setBulkReason("");
    setBulkSummary(null);
    if (bulkAction === "updateDiscount") {
      setBulkParams({ discount_type: "percent" });
    } else {
      setBulkParams({});
    }
  }, [bulkAction]);

  const openItemModal = (item = null) => {
    setItemModal({
      item_id: item?.itemId ?? "",
      discount_type: item?.discount_type ?? "percent",
      discount_value: item?.discount_value ?? ""
    });
  };

  const saveItem = async (event) => {
    event.preventDefault();
    if (!selectedCampaign) return;
    const payload = {
      item_id: Number(itemModal.item_id),
      discount_type: itemModal.discount_type,
      discount_value: Number(itemModal.discount_value)
    };
    const isEdit = items.some((i) => i.itemId === payload.item_id);
    const result = isEdit
      ? await apiJson(
          `/api/outlets/${outletId}/campaigns/${selectedCampaign.id}/items/${payload.item_id}`,
          { method: "PATCH", body: JSON.stringify(payload) }
        )
      : await apiJson(
          `/api/outlets/${outletId}/campaigns/${selectedCampaign.id}/items`,
          { method: "POST", body: JSON.stringify(payload) }
        );
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Campaign item saved" });
    setItemModal(null);
    fetchCampaignItems(selectedCampaign.id);
  };

  const deleteItem = (item) => {
    if (!selectedCampaign) return;
    confirm({
      title: "Remove item from campaign?",
      description: "Item will be removed immediately.",
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/campaigns/${selectedCampaign.id}/items/${item.itemId}`,
          { method: "DELETE" }
        );
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "Item removed" });
        fetchCampaignItems(selectedCampaign.id);
      }
    });
  };

  const bulkActions = useMemo(() => {
    const actions = [];
    if (canBulk) {
      actions.push({ value: "updateDiscount", label: "Update discount" });
      actions.push({ value: "removeItems", label: "Remove items" });
    }
    return actions;
  }, [canBulk]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.itemId)),
    [items, selectedIds]
  );

  const openBulkPreview = () => {
    if (!bulkAction) {
      setToast({ type: "error", message: "Select bulk action" });
      return;
    }
    if (selectedItems.length === 0) {
      setToast({ type: "error", message: "Select items first" });
      return;
    }
    if (
      bulkAction === "updateDiscount" &&
      (bulkParams.discount_value === "" || bulkParams.discount_value === undefined)
    ) {
      setToast({ type: "error", message: "Enter discount value" });
      return;
    }
    const preview = selectedItems.slice(0, 20).map((item) => {
      const changes = [];
      if (bulkAction === "updateDiscount") {
        const type = bulkParams.discount_type || item.discount_type;
        changes.push({
          label: "Discount",
          from: `${item.discount_type} ${item.discount_value}`,
          to: `${type} ${bulkParams.discount_value}`
        });
      }
      if (bulkAction === "removeItems") {
        changes.push({
          label: "Campaign",
          from: selectedCampaign?.title || "-",
          to: "removed"
        });
      }
      return { id: item.itemId, title: item.title, changes };
    });
    setBulkPreviewRows(preview);
    setBulkPreviewOpen(true);
  };

  const confirmBulkAction = async () => {
    if (!selectedCampaign) return;
    if (!bulkReason.trim()) {
      setToast({ type: "error", message: "Reason is required" });
      return;
    }
    setBulkSubmitting(true);
    const paramsPayload = { ...bulkParams };
    if (bulkAction === "updateDiscount") {
      paramsPayload.discount_value = Number(bulkParams.discount_value);
    }
    const result = await bulkUpdateCampaignItems({
      outletId,
      campaignId: selectedCampaign.id,
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
    fetchCampaignItems(selectedCampaign.id);
  };

  const menuOptions = useMemo(
    () => menuItems.map((item) => ({ value: item.itemId, label: item.title })),
    [menuItems]
  );

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="profile-title">Campaigns</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          {canManage ? (
            <button className="button" type="button" onClick={() => openCampaignModal()}>
              Create campaign
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : campaigns.length === 0 ? (
        <div className="empty-state">No campaigns yet</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>{campaign.title}</td>
                <td>
                  <span className="badge">{campaign.status}</span>
                </td>
                <td>{campaign.start_at || "-"}</td>
                <td>{campaign.end_at || "-"}</td>
                <td>{campaign.items_count}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => openCampaignItems(campaign)}
                    >
                      View
                    </button>
                    {canManage ? (
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => openCampaignModal(campaign)}
                      >
                        Edit
                      </button>
                    ) : null}
                    {canManage && campaign.status !== "active" ? (
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => handleActivate(campaign)}
                      >
                        Activate
                      </button>
                    ) : null}
                    {canBulk && campaign.status === "active" ? (
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => handleEnd(campaign)}
                      >
                        End
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedCampaign ? (
        <section className="card profile-card">
          <div className="profile-title">Campaign items</div>
          <div className="helper-text">{selectedCampaign.title}</div>
          <div className="toolbar">
            <div className="toolbar-actions">
              {canManage ? (
                <button className="button" type="button" onClick={() => openItemModal()}>
                  Add item
                </button>
              ) : null}
              {canBulk && selectedCampaign.status === "active" ? (
                <button className="button ghost" type="button" onClick={() => handleEnd(selectedCampaign)}>
                  End campaign
                </button>
              ) : null}
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
              {bulkAction === "updateDiscount" ? (
                <>
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
          {itemsLoading ? (
            <div className="skeleton-block" />
          ) : items.length === 0 ? (
            <div className="empty-state">No items yet</div>
          ) : (
            <BulkSelectionTable
              items={items}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getRowId={(item) => item.itemId}
            >
              {({ headerCheckbox, getRowCheckbox }) => (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{headerCheckbox}</th>
                      <th>Item</th>
                      <th>Base price</th>
                      <th>Discount</th>
                      <th>Result price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.itemId}>
                        <td>{getRowCheckbox(item.itemId)}</td>
                        <td>{item.title}</td>
                        <td>{item.basePrice}</td>
                        <td>{`${item.discount_type} ${item.discount_value}`}</td>
                        <td>{computeCurrentPrice(Number(item.basePrice || 0), item)}</td>
                        <td>
                          {canManage ? (
                            <div className="table-actions">
                              <button
                                className="action-link"
                                type="button"
                                onClick={() => openItemModal(item)}
                              >
                                Edit
                              </button>
                              <button
                                className="action-link"
                                type="button"
                                onClick={() => deleteItem(item)}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </BulkSelectionTable>
          )}
        </section>
      ) : null}

      <Modal
        open={Boolean(campaignModal)}
        title={campaignModal?.id ? "Edit campaign" : "Create campaign"}
        onClose={() => setCampaignModal(null)}
      >
        {campaignModal ? (
          <form className="form-grid" onSubmit={saveCampaign}>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="campaignTitle">Title</label>
                <input
                  id="campaignTitle"
                  className="input"
                  value={campaignModal.title}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, title: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="campaignStart">Start</label>
                <input
                  id="campaignStart"
                  className="input"
                  type="datetime-local"
                  value={campaignModal.start_at}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, start_at: event.target.value })
                  }
                />
              </div>
              <div className="auth-field">
                <label htmlFor="campaignEnd">End</label>
                <input
                  id="campaignEnd"
                  className="input"
                  type="datetime-local"
                  value={campaignModal.end_at}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, end_at: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="button" type="submit">
                Save
              </button>
              <button className="button ghost" type="button" onClick={() => setCampaignModal(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(itemModal)}
        title="Campaign item"
        onClose={() => setItemModal(null)}
      >
        {itemModal ? (
          <form className="form-grid" onSubmit={saveItem}>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="campaignItem">Item</label>
                <select
                  id="campaignItem"
                  className="select"
                  value={itemModal.item_id}
                  onChange={(event) =>
                    setItemModal({ ...itemModal, item_id: event.target.value })
                  }
                >
                  <option value="">Select item</option>
                  {menuOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="campaignType">Discount type</label>
                <select
                  id="campaignType"
                  className="select"
                  value={itemModal.discount_type}
                  onChange={(event) =>
                    setItemModal({ ...itemModal, discount_type: event.target.value })
                  }
                >
                  {discountTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="campaignValue">Discount value</label>
                <input
                  id="campaignValue"
                  className="input"
                  value={itemModal.discount_value}
                  onChange={(event) =>
                    setItemModal({ ...itemModal, discount_value: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="button" type="submit">
                Save
              </button>
              <button className="button ghost" type="button" onClick={() => setItemModal(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
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
    </section>
  );
}

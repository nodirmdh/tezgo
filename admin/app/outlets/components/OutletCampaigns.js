"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { normalizeRole } from "../../../lib/rbac";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

const discountTypes = [
  { value: "percent", labelKey: "outlets.campaigns.discount.percent" },
  { value: "fixed", labelKey: "outlets.campaigns.discount.fixed" },
  { value: "new_price", labelKey: "outlets.campaigns.discount.newPrice" }
];

const campaignStatusOptions = [
  { value: "planned", labelKey: "outlets.campaigns.status.planned" },
  { value: "active", labelKey: "outlets.campaigns.status.active" },
  { value: "ended", labelKey: "outlets.campaigns.status.ended" }
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
  const { t } = useLocale();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [campaignModal, setCampaignModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const { confirm, dialog } = useConfirm();

  const canManage = normalizeRole(role) === "admin";

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

  const fetchOutlets = async () => {
    const result = await apiJson("/api/outlets");
    if (result.ok) {
      setOutlets(result.data || []);
    }
  };

  const fetchCampaignItems = async (campaignId) => {
    setItemsLoading(true);
    const result = await apiJson(
      `/api/outlets/${outletId}/campaigns/${campaignId}/items`
    );
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setItemsLoading(false);
      return;
    }
    setItems(result.data || []);
    setItemsLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
    fetchMenuItems();
    fetchOutlets();
  }, []);

  const openCampaignModal = (campaign = null) => {
    setCampaignModal({
      id: campaign?.id ?? null,
      title: campaign?.title ?? "",
      start_at: campaign?.start_at ?? "",
      end_at: campaign?.end_at ?? "",
      status: campaign?.status ?? "planned",
      outlet_ids: campaign?.id ? [outletId] : [outletId]
    });
  };

  const saveCampaign = async (event) => {
    event.preventDefault();
    if (!campaignModal?.title) {
      setToast({ type: "error", message: t("outlets.campaigns.titleRequired") });
      return;
    }
    if (!campaignModal.id && !campaignModal.outlet_ids?.length) {
      setToast({ type: "error", message: t("outlets.campaigns.outletsRequired") });
      return;
    }
    const payload = {
      title: campaignModal.title,
      start_at: campaignModal.start_at || null,
      end_at: campaignModal.end_at || null,
      status: campaignModal.status
    };
    if (campaignModal.id) {
      const result = await apiJson(`/api/outlets/${outletId}/campaigns/${campaignModal.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      if (!result.ok) {
        setToast({ type: "error", message: t(result.error) });
        return;
      }
    } else {
      const outletIds = campaignModal.outlet_ids?.length
        ? campaignModal.outlet_ids
        : [outletId];
      const results = await Promise.all(
        outletIds.map((id) =>
          apiJson(`/api/outlets/${id}/campaigns`, {
            method: "POST",
            body: JSON.stringify(payload)
          })
        )
      );
      const failed = results.find((result) => !result.ok);
      if (failed) {
        setToast({ type: "error", message: t(failed.error) });
        return;
      }
    }
    setToast({ type: "success", message: t("outlets.campaigns.saved") });
    setCampaignModal(null);
    fetchCampaigns();
  };

  const handleActivate = (campaign) => {
    confirm({
      title: t("outlets.campaigns.activateTitle"),
      description: t("outlets.campaigns.activateDescription"),
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/campaigns/${campaign.id}/activate`,
          { method: "POST" }
        );
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.campaigns.activated") });
        fetchCampaigns();
      }
    });
  };

  const handleEnd = (campaign) => {
    confirm({
      title: t("outlets.campaigns.endTitle"),
      description: t("outlets.campaigns.endDescription"),
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/campaigns/${campaign.id}/end`,
          { method: "POST" }
        );
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.campaigns.ended") });
        fetchCampaigns();
      }
    });
  };

  const openCampaignItems = async (campaign) => {
    setSelectedCampaign(campaign);
    fetchCampaignItems(campaign.id);
  };

  const openItemModal = (item = null) => {
    setItemModal({
      item_ids: item?.itemId ? [item.itemId] : [],
      discount_type: item?.discount_type ?? "percent",
      discount_value: item?.discount_value ?? "",
      bundle_name: item?.bundleName ?? "",
      mode: item ? "edit" : "create"
    });
  };

  const saveItem = async (event) => {
    event.preventDefault();
    if (!selectedCampaign) return;
    if (!itemModal.item_ids.length) {
      setToast({ type: "error", message: t("outlets.campaigns.itemsRequired") });
      return;
    }
    const payload = {
      item_ids: itemModal.item_ids.map((id) => Number(id)),
      discount_type: itemModal.discount_type,
      discount_value: Number(itemModal.discount_value),
      bundle_name: itemModal.bundle_name || null
    };
    const isEdit = itemModal.mode === "edit" && itemModal.item_ids.length === 1;
    const result = isEdit
      ? await apiJson(
          `/api/outlets/${outletId}/campaigns/${selectedCampaign.id}/items/${payload.item_ids[0]}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              discount_type: payload.discount_type,
              discount_value: payload.discount_value,
              bundle_name: payload.bundle_name
            })
          }
        )
      : await apiJson(
          `/api/outlets/${outletId}/campaigns/${selectedCampaign.id}/items`,
          { method: "POST", body: JSON.stringify(payload) }
        );
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("outlets.campaigns.itemSaved") });
    setItemModal(null);
    fetchCampaignItems(selectedCampaign.id);
  };

  const deleteItem = (item) => {
    if (!selectedCampaign) return;
    confirm({
      title: t("outlets.campaigns.itemRemoveTitle"),
      description: t("outlets.campaigns.itemRemoveDescription"),
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/campaigns/${selectedCampaign.id}/items/${item.itemId}`,
          { method: "DELETE" }
        );
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.campaigns.itemRemoved") });
        fetchCampaignItems(selectedCampaign.id);
      }
    });
  };

  const menuOptions = useMemo(
    () => menuItems.map((item) => ({ value: String(item.itemId), label: item.title })),
    [menuItems]
  );
  const outletOptions = useMemo(
    () => outlets.map((outlet) => ({ value: String(outlet.id), label: outlet.name })),
    [outlets]
  );

  const updateSelectedOutlets = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) =>
      Number(option.value)
    );
    setCampaignModal((current) => ({ ...current, outlet_ids: values }));
  };

  const updateSelectedItems = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) =>
      Number(option.value)
    );
    setItemModal((current) => ({ ...current, item_ids: values }));
  };

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="profile-title">{t("outlets.campaigns.title")}</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          {canManage ? (
            <button className="button" type="button" onClick={() => openCampaignModal()}>
              {t("outlets.campaigns.create")}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : campaigns.length === 0 ? (
        <div className="empty-state">{t("outlets.campaigns.empty")}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("outlets.campaigns.table.title")}</th>
              <th>{t("outlets.campaigns.table.status")}</th>
              <th>{t("outlets.campaigns.table.start")}</th>
              <th>{t("outlets.campaigns.table.end")}</th>
              <th>{t("outlets.campaigns.table.items")}</th>
              <th>{t("orders.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>{campaign.title}</td>
                <td>
                  <span className="badge">
                    {t(`outlets.campaigns.status.${campaign.status}`, {
                      defaultValue: campaign.status
                    })}
                  </span>
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
                      {t("common.view")}
                    </button>
                    {canManage ? (
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => openCampaignModal(campaign)}
                      >
                        {t("common.edit")}
                      </button>
                    ) : null}
                    {canManage && campaign.status !== "active" ? (
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => handleActivate(campaign)}
                      >
                        {t("outlets.campaigns.activate")}
                      </button>
                    ) : null}
                    {canManage && campaign.status === "active" ? (
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => handleEnd(campaign)}
                      >
                        {t("outlets.campaigns.end")}
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
          <div className="profile-title">{t("outlets.campaigns.itemsTitle")}</div>
          <div className="helper-text">{selectedCampaign.title}</div>
          {canManage ? (
            <button className="button" type="button" onClick={() => openItemModal()}>
              {t("outlets.campaigns.addItem")}
            </button>
          ) : null}
          {itemsLoading ? (
            <div className="skeleton-block" />
          ) : items.length === 0 ? (
            <div className="empty-state">{t("outlets.campaigns.itemsEmpty")}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("outlets.campaigns.itemsTable.item")}</th>
                  <th>{t("outlets.campaigns.itemsTable.basePrice")}</th>
                  <th>{t("outlets.campaigns.itemsTable.discount")}</th>
                  <th>{t("outlets.campaigns.itemsTable.bundle")}</th>
                  <th>{t("outlets.campaigns.itemsTable.resultPrice")}</th>
                  <th>{t("orders.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.itemId}>
                    <td>{item.title}</td>
                    <td>{item.basePrice}</td>
                    <td>{`${item.discount_type} ${item.discount_value}`}</td>
                    <td>{item.bundleName || "-"}</td>
                    <td>{computeCurrentPrice(Number(item.basePrice || 0), item)}</td>
                    <td>
                      {canManage ? (
                        <div className="table-actions">
                          <button
                            className="action-link"
                            type="button"
                            onClick={() => openItemModal(item)}
                          >
                            {t("common.edit")}
                          </button>
                          <button
                            className="action-link"
                            type="button"
                            onClick={() => deleteItem(item)}
                          >
                            {t("outlets.campaigns.remove")}
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
        </section>
      ) : null}

      <Modal
        open={Boolean(campaignModal)}
        title={campaignModal?.id ? t("outlets.campaigns.edit") : t("outlets.campaigns.create")}
        onClose={() => setCampaignModal(null)}
      >
        {campaignModal ? (
          <form className="form-grid" onSubmit={saveCampaign}>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="campaignTitle">{t("outlets.campaigns.form.title")}</label>
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
            {!campaignModal.id ? (
              <div className="form-row">
                <div className="auth-field">
                  <label htmlFor="campaignOutlets">{t("outlets.campaigns.form.outlets")}</label>
                  <select
                    id="campaignOutlets"
                    className="select"
                    multiple
                    value={campaignModal.outlet_ids.map(String)}
                    onChange={updateSelectedOutlets}
                  >
                    {outletOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="campaignStart">{t("outlets.campaigns.form.start")}</label>
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
                <label htmlFor="campaignEnd">{t("outlets.campaigns.form.end")}</label>
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
            {!campaignModal.id ? (
              <div className="form-row">
                <div className="auth-field">
                  <label htmlFor="campaignStatus">{t("outlets.campaigns.form.status")}</label>
                  <select
                    id="campaignStatus"
                    className="select"
                    value={campaignModal.status}
                    onChange={(event) =>
                      setCampaignModal({ ...campaignModal, status: event.target.value })
                    }
                  >
                    {campaignStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
            <div className="modal-actions">
              <button className="button" type="submit">
                {t("common.save")}
              </button>
              <button className="button ghost" type="button" onClick={() => setCampaignModal(null)}>
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(itemModal)}
        title={t("outlets.campaigns.itemTitle")}
        onClose={() => setItemModal(null)}
      >
        {itemModal ? (
          <form className="form-grid" onSubmit={saveItem}>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="campaignItem">{t("outlets.campaigns.form.item")}</label>
                <select
                  id="campaignItem"
                  className="select"
                  multiple={itemModal.mode !== "edit"}
                  disabled={itemModal.mode === "edit"}
                  value={itemModal.item_ids.map(String)}
                  onChange={updateSelectedItems}
                >
                  {itemModal.mode !== "edit" ? (
                    <option value="" disabled>
                      {t("outlets.campaigns.selectItems")}
                    </option>
                  ) : null}
                  {menuOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="campaignType">{t("outlets.campaigns.form.discountType")}</label>
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
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="campaignValue">{t("outlets.campaigns.form.discountValue")}</label>
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
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="campaignBundle">{t("outlets.campaigns.form.bundle")}</label>
                <input
                  id="campaignBundle"
                  className="input"
                  value={itemModal.bundle_name}
                  onChange={(event) =>
                    setItemModal({ ...itemModal, bundle_name: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="button" type="submit">
                {t("common.save")}
              </button>
              <button className="button ghost" type="button" onClick={() => setItemModal(null)}>
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </section>
  );
}

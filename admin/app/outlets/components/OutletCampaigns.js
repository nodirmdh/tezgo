
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { normalizeRole } from "../../../lib/rbac";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

const campaignTypes = ["discount", "bundle", "bogo"];
const deliveryOptions = [
  { value: "courier", labelKey: "outlets.campaigns.delivery.courier" },
  { value: "pickup", labelKey: "outlets.campaigns.delivery.pickup" }
];
const weekdays = [
  { value: "mon", labelKey: "outlets.campaigns.days.mon" },
  { value: "tue", labelKey: "outlets.campaigns.days.tue" },
  { value: "wed", labelKey: "outlets.campaigns.days.wed" },
  { value: "thu", labelKey: "outlets.campaigns.days.thu" },
  { value: "fri", labelKey: "outlets.campaigns.days.fri" },
  { value: "sat", labelKey: "outlets.campaigns.days.sat" },
  { value: "sun", labelKey: "outlets.campaigns.days.sun" }
];

const discountTypes = [
  { value: "percent", labelKey: "outlets.campaigns.discount.percent" },
  { value: "fixed", labelKey: "outlets.campaigns.discount.fixed" },
  { value: "new_price", labelKey: "outlets.campaigns.discount.newPrice" }
];

const campaignStatusOptions = [
  { value: "draft", labelKey: "outlets.campaigns.status.draft" },
  { value: "active", labelKey: "outlets.campaigns.status.active" },
  { value: "paused", labelKey: "outlets.campaigns.status.paused" },
  { value: "expired", labelKey: "outlets.campaigns.status.expired" },
  { value: "archived", labelKey: "outlets.campaigns.status.archived" }
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

const defaultCampaignDraft = {
  title: "",
  description: "",
  type: "discount",
  priority: 0,
  status: "draft",
  start_at: "",
  end_at: "",
  active_days: [],
  active_hours: { from: "", to: "" },
  min_order_amount: "",
  max_uses_total: "",
  max_uses_per_client: "",
  delivery_methods: [],
  stoplist_policy: "hide",
  bundle_price_mode: "fixed",
  bundle_fixed_price: "",
  bundle_percent_discount: "",
  items: []
};

export default function OutletCampaigns({ outletId, role }) {
  const router = useRouter();
  const { t } = useLocale();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    type: "",
    sort: "priority:desc",
    page: 1,
    limit: 10,
    total: 0
  });
  const [campaignModal, setCampaignModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const { confirm, dialog } = useConfirm();

  const canManage = normalizeRole(role) === "admin";

  const totalPages = useMemo(() => {
    if (!filters.limit) return 1;
    return Math.max(1, Math.ceil((filters.total || 0) / filters.limit));
  }, [filters]);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: filters.q,
      status: filters.status,
      type: filters.type,
      sort: filters.sort,
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/outlets/${outletId}/campaigns?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setCampaigns(result.data?.items || []);
    setFilters((current) => ({ ...current, total: result.data?.total || 0 }));
    setLoading(false);
  };

  const fetchMenuItems = async () => {
    const result = await apiJson(`/api/outlets/${outletId}/items?limit=200`);
    if (result.ok) {
      setMenuItems(result.data.items || []);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchCampaigns, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const openCreateModal = () => {
    setCampaignModal({ ...defaultCampaignDraft });
  };

  const openItemModal = (item = null) => {
    setItemModal({
      item_id: item?.item_id ?? "",
      qty: item?.qty ?? 1,
      required: item?.required ?? 1,
      discount_type: item?.discount_type ?? "percent",
      discount_value: item?.discount_value ?? "",
      mode: item ? "edit" : "create"
    });
  };
  const addOrUpdateItem = (event) => {
    event.preventDefault();
    if (!campaignModal) return;
    const itemId = Number(itemModal.item_id);
    if (!itemId) {
      setToast({ type: "error", message: t("outlets.campaigns.itemsRequired") });
      return;
    }
    const target = {
      item_id: itemId,
      qty: Number(itemModal.qty || 1),
      required: itemModal.required ? 1 : 0,
      discount_type: itemModal.discount_type,
      discount_value: Number(itemModal.discount_value || 0)
    };
    const nextItems =
      itemModal.mode === "edit"
        ? campaignModal.items.map((item) =>
            item.item_id === itemId ? { ...item, ...target } : item
          )
        : [...campaignModal.items.filter((item) => item.item_id !== itemId), target];
    setCampaignModal({ ...campaignModal, items: nextItems });
    setItemModal(null);
  };

  const removeItem = (item) => {
    if (!campaignModal) return;
    setCampaignModal({
      ...campaignModal,
      items: campaignModal.items.filter((row) => row.item_id !== item.item_id)
    });
  };

  const saveCampaign = async (event) => {
    event.preventDefault();
    if (!campaignModal?.title) {
      setToast({ type: "error", message: t("outlets.campaigns.titleRequired") });
      return;
    }
    if (!campaignModal.items.length) {
      setToast({ type: "error", message: t("outlets.campaigns.itemsRequired") });
      return;
    }
    const payload = {
      title: campaignModal.title,
      description: campaignModal.description || null,
      type: campaignModal.type,
      priority: Number(campaignModal.priority || 0),
      status: campaignModal.status,
      start_at: campaignModal.start_at || null,
      end_at: campaignModal.end_at || null,
      active_days: campaignModal.active_days,
      active_hours:
        campaignModal.active_hours?.from || campaignModal.active_hours?.to
          ? campaignModal.active_hours
          : null,
      min_order_amount:
        campaignModal.min_order_amount === "" ? null : Number(campaignModal.min_order_amount),
      max_uses_total:
        campaignModal.max_uses_total === "" ? null : Number(campaignModal.max_uses_total),
      max_uses_per_client:
        campaignModal.max_uses_per_client === ""
          ? null
          : Number(campaignModal.max_uses_per_client),
      delivery_methods: campaignModal.delivery_methods,
      stoplist_policy: campaignModal.stoplist_policy,
      bundle_fixed_price:
        campaignModal.type === "bundle" && campaignModal.bundle_price_mode === "fixed"
          ? Number(campaignModal.bundle_fixed_price || 0)
          : null,
      bundle_percent_discount:
        campaignModal.type === "bundle" && campaignModal.bundle_price_mode === "percent"
          ? Number(campaignModal.bundle_percent_discount || 0)
          : null,
      items: campaignModal.items
    };
    const result = await apiJson(`/api/outlets/${outletId}/campaigns`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("outlets.campaigns.saved") });
    setCampaignModal(null);
    fetchCampaigns();
    if (result.data?.id) {
      router.push(`/campaigns/${result.data.id}`);
    }
  };

  const handleActivate = (campaign) => {
    confirm({
      title: t("outlets.campaigns.activateTitle"),
      description: t("outlets.campaigns.activateDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/campaigns/${campaign.id}/activate`, {
          method: "POST"
        });
        if (!result.ok) {
          const message =
            result.status >= 500
              ? t("outlets.campaigns.errors.activate")
              : t(result.error);
          setToast({ type: "error", message });
          return;
        }
        setToast({ type: "success", message: t("outlets.campaigns.activated") });
        fetchCampaigns();
      }
    });
  };

  const handlePause = (campaign) => {
    confirm({
      title: t("outlets.campaigns.pauseTitle"),
      description: t("outlets.campaigns.pauseDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/campaigns/${campaign.id}/pause`, {
          method: "POST"
        });
        if (!result.ok) {
          const message =
            result.status >= 500 ? t("outlets.campaigns.errors.pause") : t(result.error);
          setToast({ type: "error", message });
          return;
        }
        setToast({ type: "success", message: t("outlets.campaigns.paused") });
        fetchCampaigns();
      }
    });
  };

  const handleArchive = (campaign) => {
    confirm({
      title: t("outlets.campaigns.archiveTitle"),
      description: t("outlets.campaigns.archiveDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/campaigns/${campaign.id}`, {
          method: "DELETE"
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.campaigns.archived") });
        fetchCampaigns();
      }
    });
  };

  const menuOptions = useMemo(
    () => menuItems.map((item) => ({ value: String(item.itemId), label: item.title })),
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
      <div className="profile-title">{t("outlets.campaigns.title")}</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder={t("outlets.campaigns.search")}
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value, page: 1 })}
          />
          <select
            className="select"
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 1 })}
          >
            <option value="">{t("outlets.campaigns.filters.allStatuses")}</option>
            {campaignStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.type}
            onChange={(event) => setFilters({ ...filters, type: event.target.value, page: 1 })}
          >
            <option value="">{t("outlets.campaigns.filters.allTypes")}</option>
            {campaignTypes.map((type) => (
              <option key={type} value={type}>
                {t(`outlets.campaigns.types.${type}`, { defaultValue: type })}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value, page: 1 })}
          >
            <option value="priority:desc">{t("outlets.campaigns.sort.priority")}</option>
            <option value="created_at:desc">{t("outlets.campaigns.sort.created")}</option>
            <option value="start_at:asc">{t("outlets.campaigns.sort.start")}</option>
            <option value="end_at:asc">{t("outlets.campaigns.sort.end")}</option>
          </select>
          {canManage ? (
            <button className="button" type="button" onClick={openCreateModal}>
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
              <th>{t("outlets.campaigns.table.type")}</th>
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
                <td>{t(`outlets.campaigns.types.${campaign.type}`, { defaultValue: campaign.type })}</td>
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
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      {t("outlets.campaigns.open")}
                    </button>
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
                        onClick={() => handlePause(campaign)}
                      >
                        {t("outlets.campaigns.pause")}
                      </button>
                    ) : null}
                    {canManage ? (
                      <button
                        className="action-link danger"
                        type="button"
                        onClick={() => handleArchive(campaign)}
                      >
                        {t("outlets.campaigns.archive")}
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
          onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
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
          onClick={() => setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })}
        >
          {t("common.next")}
        </button>
      </div>
      <Modal
        open={Boolean(campaignModal)}
        title={t("outlets.campaigns.create")}
        onClose={() => setCampaignModal(null)}
      >
        {campaignModal ? (
          <form className="form-grid" onSubmit={saveCampaign}>
            <div className="form-row">
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.title")}</label>
                <input
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
                <label>{t("outlets.campaigns.form.type")}</label>
                <select
                  className="select"
                  value={campaignModal.type}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, type: event.target.value })
                  }
                >
                  {campaignTypes.map((type) => (
                    <option key={type} value={type}>
                      {t(`outlets.campaigns.types.${type}`, { defaultValue: type })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.priority")}</label>
                <input
                  className="input"
                  type="number"
                  value={campaignModal.priority}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, priority: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.description")}</label>
                <textarea
                  className="textarea"
                  value={campaignModal.description}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, description: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.start")}</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={campaignModal.start_at}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, start_at: event.target.value })
                  }
                />
              </div>
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.end")}</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={campaignModal.end_at}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, end_at: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="profile-grid">
                {weekdays.map((day) => (
                  <label key={day.value} className="checkbox">
                    <input
                      type="checkbox"
                      checked={campaignModal.active_days.includes(day.value)}
                      onChange={(event) => {
                        const next = new Set(campaignModal.active_days);
                        if (event.target.checked) {
                          next.add(day.value);
                        } else {
                          next.delete(day.value);
                        }
                        setCampaignModal({ ...campaignModal, active_days: Array.from(next) });
                      }}
                    />
                    <span>{t(day.labelKey)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.activeFrom")}</label>
                <input
                  className="input"
                  type="time"
                  value={campaignModal.active_hours.from}
                  onChange={(event) =>
                    setCampaignModal({
                      ...campaignModal,
                      active_hours: { ...campaignModal.active_hours, from: event.target.value }
                    })
                  }
                />
              </div>
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.activeTo")}</label>
                <input
                  className="input"
                  type="time"
                  value={campaignModal.active_hours.to}
                  onChange={(event) =>
                    setCampaignModal({
                      ...campaignModal,
                      active_hours: { ...campaignModal.active_hours, to: event.target.value }
                    })
                  }
                />
              </div>
            </div>
            <div className="form-row three">
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.minOrder")}</label>
                <input
                  className="input"
                  type="number"
                  value={campaignModal.min_order_amount}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, min_order_amount: event.target.value })
                  }
                />
              </div>
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.maxUsesTotal")}</label>
                <input
                  className="input"
                  type="number"
                  value={campaignModal.max_uses_total}
                  onChange={(event) =>
                    setCampaignModal({ ...campaignModal, max_uses_total: event.target.value })
                  }
                />
              </div>
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.maxUsesClient")}</label>
                <input
                  className="input"
                  type="number"
                  value={campaignModal.max_uses_per_client}
                  onChange={(event) =>
                    setCampaignModal({
                      ...campaignModal,
                      max_uses_per_client: event.target.value
                    })
                  }
                />
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.stoplistPolicy")}</label>
                <select
                  className="select"
                  value={campaignModal.stoplist_policy}
                  onChange={(event) =>
                    setCampaignModal({
                      ...campaignModal,
                      stoplist_policy: event.target.value
                    })
                  }
                >
                  <option value="hide">{t("outlets.campaigns.stoplist.hide")}</option>
                  <option value="disable">{t("outlets.campaigns.stoplist.disable")}</option>
                </select>
              </div>
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.delivery")}</label>
                <div className="profile-grid">
                  {deliveryOptions.map((option) => (
                    <label key={option.value} className="checkbox">
                      <input
                        type="checkbox"
                        checked={campaignModal.delivery_methods.includes(option.value)}
                        onChange={(event) => {
                          const next = new Set(campaignModal.delivery_methods);
                          if (event.target.checked) {
                            next.add(option.value);
                          } else {
                            next.delete(option.value);
                          }
                          setCampaignModal({
                            ...campaignModal,
                            delivery_methods: Array.from(next)
                          });
                        }}
                      />
                      <span>{t(option.labelKey)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {campaignModal.type === "bundle" ? (
              <div className="form-row">
                <div className="auth-field">
                  <label>{t("outlets.campaigns.form.bundlePricing")}</label>
                  <div className="profile-grid">
                    <label className="checkbox">
                      <input
                        type="radio"
                        name="bundlePricing"
                        checked={campaignModal.bundle_price_mode === "fixed"}
                        onChange={() =>
                          setCampaignModal({ ...campaignModal, bundle_price_mode: "fixed" })
                        }
                      />
                      <span>{t("outlets.campaigns.bundle.fixed")}</span>
                    </label>
                    <label className="checkbox">
                      <input
                        type="radio"
                        name="bundlePricing"
                        checked={campaignModal.bundle_price_mode === "percent"}
                        onChange={() =>
                          setCampaignModal({ ...campaignModal, bundle_price_mode: "percent" })
                        }
                      />
                      <span>{t("outlets.campaigns.bundle.percent")}</span>
                    </label>
                  </div>
                </div>
                {campaignModal.bundle_price_mode === "fixed" ? (
                  <div className="auth-field">
                    <label>{t("outlets.campaigns.bundle.fixedPrice")}</label>
                    <input
                      className="input"
                      type="number"
                      value={campaignModal.bundle_fixed_price}
                      onChange={(event) =>
                        setCampaignModal({
                          ...campaignModal,
                          bundle_fixed_price: event.target.value
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="auth-field">
                    <label>{t("outlets.campaigns.bundle.percentDiscount")}</label>
                    <input
                      className="input"
                      type="number"
                      value={campaignModal.bundle_percent_discount}
                      onChange={(event) =>
                        setCampaignModal({
                          ...campaignModal,
                          bundle_percent_discount: event.target.value
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ) : null}
            <div className="profile-section">
              <div className="profile-title">{t("outlets.campaigns.itemsTitle")}</div>
              <button className="button" type="button" onClick={() => openItemModal()}>
                {t("outlets.campaigns.addItem")}
              </button>
              {campaignModal.items.length === 0 ? (
                <div className="empty-state">{t("outlets.campaigns.itemsEmpty")}</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("outlets.campaigns.itemsTable.item")}</th>
                      <th>{t("outlets.campaigns.itemsTable.qty")}</th>
                      <th>{t("outlets.campaigns.itemsTable.required")}</th>
                      {campaignModal.type === "discount" ? (
                        <th>{t("outlets.campaigns.itemsTable.discount")}</th>
                      ) : null}
                      <th>{t("orders.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignModal.items.map((item) => (
                      <tr key={item.item_id}>
                        <td>
                          {menuOptions.find((option) => Number(option.value) === item.item_id)
                            ?.label || item.item_id}
                        </td>
                        <td>{item.qty}</td>
                        <td>{item.required ? t("common.yes") : t("common.no")}</td>
                        {campaignModal.type === "discount" ? (
                          <td>{`${item.discount_type} ${item.discount_value}`}</td>
                        ) : null}
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-link"
                              type="button"
                              onClick={() => openItemModal(item)}
                            >
                              {t("common.edit")}
                            </button>
                            <button
                              className="action-link danger"
                              type="button"
                              onClick={() => removeItem(item)}
                            >
                              {t("common.delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
          <form className="form-grid" onSubmit={addOrUpdateItem}>
            <div className="form-row two">
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.item")}</label>
                <select
                  className="select"
                  value={itemModal.item_id ?? ""}
                  onChange={(event) =>
                    setItemModal({ ...itemModal, item_id: Number(event.target.value) })
                  }
                  required
                >
                  <option value="" disabled>
                    {t("outlets.campaigns.selectItems")}
                  </option>
                  {menuOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label>{t("outlets.campaigns.form.qty")}</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={itemModal.qty}
                  onChange={(event) =>
                    setItemModal({ ...itemModal, qty: Number(event.target.value || 1) })
                  }
                />
              </div>
            </div>
            {campaignModal?.type === "discount" ? (
              <div className="form-row two">
                <div className="auth-field">
                  <label>{t("outlets.campaigns.form.discountType")}</label>
                  <select
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
                <div className="auth-field">
                  <label>{t("outlets.campaigns.form.discountValue")}</label>
                  <input
                    className="input"
                    value={itemModal.discount_value}
                    onChange={(event) =>
                      setItemModal({ ...itemModal, discount_value: event.target.value })
                    }
                  />
                </div>
              </div>
            ) : null}
            <div className="form-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(itemModal.required)}
                  onChange={(event) =>
                    setItemModal({ ...itemModal, required: event.target.checked ? 1 : 0 })
                  }
                />
                <span>{t("outlets.campaigns.form.required")}</span>
              </label>
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

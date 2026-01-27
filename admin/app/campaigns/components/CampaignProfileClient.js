
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
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

const normalizeDraft = (campaign) => {
  const bundleMode = campaign?.bundle_fixed_price ? "fixed" : "percent";
  return {
    title: campaign?.title ?? "",
    description: campaign?.description ?? "",
    type: campaign?.type ?? "discount",
    priority: campaign?.priority ?? 0,
    status: campaign?.status ?? "draft",
    start_at: campaign?.start_at ?? "",
    end_at: campaign?.end_at ?? "",
    active_days: campaign?.active_days ?? [],
    active_hours: campaign?.active_hours ?? { from: "", to: "" },
    min_order_amount: campaign?.min_order_amount ?? "",
    max_uses_total: campaign?.max_uses_total ?? "",
    max_uses_per_client: campaign?.max_uses_per_client ?? "",
    delivery_methods: campaign?.delivery_methods ?? [],
    stoplist_policy: campaign?.stoplist_policy ?? "hide",
    bundle_price_mode: bundleMode,
    bundle_fixed_price: campaign?.bundle_fixed_price ?? "",
    bundle_percent_discount: campaign?.bundle_percent_discount ?? ""
  };
};

export default function CampaignProfileClient({ initialCampaign, outlet }) {
  const router = useRouter();
  const { t } = useLocale();
  const { confirm, dialog } = useConfirm();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [draft, setDraft] = useState(normalizeDraft(initialCampaign));
  const [items, setItems] = useState(initialCampaign?.items || []);
  const [menuItems, setMenuItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);

  useEffect(() => {
    setDraft(normalizeDraft(campaign));
    setItems(campaign?.items || []);
  }, [campaign]);

  const menuOptions = useMemo(
    () => menuItems.map((item) => ({ value: String(item.itemId), label: item.title })),
    [menuItems]
  );

  const loadMenuItems = async () => {
    const result = await apiJson(`/api/outlets/${campaign.outlet_id}/items?limit=200`);
    if (result.ok) {
      setMenuItems(result.data.items || []);
    }
  };

  const loadOrders = async (page = 1) => {
    setOrdersLoading(true);
    const result = await apiJson(`/api/campaigns/${campaign.id}/orders?page=${page}`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setOrdersLoading(false);
      return;
    }
    setOrders(result.data.items || []);
    setOrdersTotal(result.data.total || 0);
    setOrdersPage(result.data.page || page);
    setOrdersLoading(false);
  };

  useEffect(() => {
    loadMenuItems();
    loadOrders(1);
  }, [campaign.id]);
  useEffect(() => {
    const timer = setTimeout(async () => {
      const payload = buildPayload();
      const result = await apiJson(`/api/campaigns/${campaign.id}/validate`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!result.ok) {
        setWarnings([]);
        return;
      }
      setWarnings(result.data?.warnings || []);
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, items]);

  const buildPayload = () => ({
    title: draft.title,
    description: draft.description || null,
    type: draft.type,
    priority: Number(draft.priority || 0),
    status: draft.status,
    start_at: draft.start_at || null,
    end_at: draft.end_at || null,
    active_days: draft.active_days,
    active_hours: draft.active_hours?.from || draft.active_hours?.to ? draft.active_hours : null,
    min_order_amount: draft.min_order_amount === "" ? null : Number(draft.min_order_amount),
    max_uses_total: draft.max_uses_total === "" ? null : Number(draft.max_uses_total),
    max_uses_per_client: draft.max_uses_per_client === "" ? null : Number(draft.max_uses_per_client),
    delivery_methods: draft.delivery_methods,
    stoplist_policy: draft.stoplist_policy,
    bundle_fixed_price:
      draft.type === "bundle" && draft.bundle_price_mode === "fixed"
        ? Number(draft.bundle_fixed_price || 0)
        : null,
    bundle_percent_discount:
      draft.type === "bundle" && draft.bundle_price_mode === "percent"
        ? Number(draft.bundle_percent_discount || 0)
        : null,
    items
  });

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

  const saveItem = (event) => {
    event.preventDefault();
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
        ? items.map((item) => (item.item_id === itemId ? { ...item, ...target } : item))
        : [...items.filter((item) => item.item_id !== itemId), target];
    setItems(nextItems);
    setItemModal(null);
  };

  const removeItem = (item) => {
    setItems(items.filter((row) => row.item_id !== item.item_id));
  };

  const saveCampaign = async () => {
    if (saving) return;
    setSaving(true);
    const payload = buildPayload();
    const result = await apiJson(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setCampaign(result.data);
    setToast({ type: "success", message: t("outlets.campaigns.saved") });
  };

  const handleActivate = () => {
    confirm({
      title: t("outlets.campaigns.activateTitle"),
      description: t("outlets.campaigns.activateDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/campaigns/${campaign.id}/activate`, {
          method: "POST"
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setCampaign(result.data);
        setToast({ type: "success", message: t("outlets.campaigns.activated") });
      }
    });
  };

  const handlePause = () => {
    confirm({
      title: t("outlets.campaigns.pauseTitle"),
      description: t("outlets.campaigns.pauseDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/campaigns/${campaign.id}/pause`, {
          method: "POST"
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setCampaign(result.data);
        setToast({ type: "success", message: t("outlets.campaigns.paused") });
      }
    });
  };

  const handleArchive = () => {
    confirm({
      title: t("outlets.campaigns.archiveTitle"),
      description: t("outlets.campaigns.archiveDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.campaigns.archived") });
        router.back();
      }
    });
  };

  const handleDuplicate = () => {
    confirm({
      title: t("outlets.campaigns.duplicateTitle"),
      description: t("outlets.campaigns.duplicateDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/campaigns/${campaign.id}/duplicate`, { method: "POST" });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.campaigns.duplicated") });
        router.push(`/campaigns/${result.data.id}`);
      }
    });
  };

  const ordersTotalPages = Math.max(1, Math.ceil(ordersTotal / 20));
  return (
    <section className="card profile-card">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {dialog}
      <div className="profile-header">
        <div>
          <div className="profile-eyebrow">{t("outlets.campaigns.profile.title")}</div>
          <div className="profile-title">{campaign.title}</div>
          <div className="helper-text">ID: {campaign.id}</div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.campaigns.profile.meta")}</div>
        <div className="profile-grid">
          <div>
            <div className="helper-text">{t("outlets.campaigns.profile.outlet")}</div>
            <div>{outlet?.name || campaign.outlet_id}</div>
          </div>
          <div>
            <div className="helper-text">{t("outlets.campaigns.profile.partner")}</div>
            <div>{outlet?.partner_name || "-"}</div>
          </div>
          <div>
            <div className="helper-text">{t("outlets.campaigns.profile.createdAt")}</div>
            <div>{campaign.created_at || "-"}</div>
          </div>
          <div>
            <div className="helper-text">{t("outlets.campaigns.profile.updatedAt")}</div>
            <div>{campaign.updated_at || "-"}</div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.campaigns.profile.basic")}</div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.title")}</label>
            <input
              className="input"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.type")}</label>
            <select
              className="select"
              value={draft.type}
              onChange={(event) => setDraft({ ...draft, type: event.target.value })}
            >
              {campaignTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`outlets.campaigns.types.${type}`, { defaultValue: type })}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.priority")}</label>
            <input
              className="input"
              type="number"
              value={draft.priority}
              onChange={(event) => setDraft({ ...draft, priority: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.status")}</label>
            <select
              className="select"
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
            >
              {campaignTypes.length
                ? ["draft", "active", "paused", "expired", "archived"].map((status) => (
                    <option key={status} value={status}>
                      {t(`outlets.campaigns.status.${status}`, { defaultValue: status })}
                    </option>
                  ))
                : null}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.description")}</label>
            <textarea
              className="textarea"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.campaigns.profile.schedule")}</div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.start")}</label>
            <input
              className="input"
              type="datetime-local"
              value={draft.start_at}
              onChange={(event) => setDraft({ ...draft, start_at: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.end")}</label>
            <input
              className="input"
              type="datetime-local"
              value={draft.end_at}
              onChange={(event) => setDraft({ ...draft, end_at: event.target.value })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="profile-grid">
            {weekdays.map((day) => (
              <label key={day.value} className="checkbox">
                <input
                  type="checkbox"
                  checked={draft.active_days.includes(day.value)}
                  onChange={(event) => {
                    const next = new Set(draft.active_days);
                    if (event.target.checked) {
                      next.add(day.value);
                    } else {
                      next.delete(day.value);
                    }
                    setDraft({ ...draft, active_days: Array.from(next) });
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
              value={draft.active_hours?.from || ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  active_hours: { ...draft.active_hours, from: event.target.value }
                })
              }
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.activeTo")}</label>
            <input
              className="input"
              type="time"
              value={draft.active_hours?.to || ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  active_hours: { ...draft.active_hours, to: event.target.value }
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.campaigns.profile.limits")}</div>
        <div className="form-row three">
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.minOrder")}</label>
            <input
              className="input"
              type="number"
              value={draft.min_order_amount}
              onChange={(event) => setDraft({ ...draft, min_order_amount: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.maxUsesTotal")}</label>
            <input
              className="input"
              type="number"
              value={draft.max_uses_total}
              onChange={(event) => setDraft({ ...draft, max_uses_total: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.maxUsesClient")}</label>
            <input
              className="input"
              type="number"
              value={draft.max_uses_per_client}
              onChange={(event) => setDraft({ ...draft, max_uses_per_client: event.target.value })}
            />
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.campaigns.form.stoplistPolicy")}</label>
            <select
              className="select"
              value={draft.stoplist_policy}
              onChange={(event) => setDraft({ ...draft, stoplist_policy: event.target.value })}
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
                    checked={draft.delivery_methods.includes(option.value)}
                    onChange={(event) => {
                      const next = new Set(draft.delivery_methods);
                      if (event.target.checked) {
                        next.add(option.value);
                      } else {
                        next.delete(option.value);
                      }
                      setDraft({ ...draft, delivery_methods: Array.from(next) });
                    }}
                  />
                  <span>{t(option.labelKey)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {draft.type === "bundle" ? (
        <div className="profile-section">
          <div className="profile-title">{t("outlets.campaigns.form.bundlePricing")}</div>
          <div className="form-row two">
            <div className="auth-field">
              <label>{t("outlets.campaigns.bundle.fixed")}</label>
              <label className="checkbox">
                <input
                  type="radio"
                  name="bundlePricingProfile"
                  checked={draft.bundle_price_mode === "fixed"}
                  onChange={() => setDraft({ ...draft, bundle_price_mode: "fixed" })}
                />
                <span>{t("outlets.campaigns.bundle.fixed")}</span>
              </label>
              <input
                className="input"
                type="number"
                value={draft.bundle_fixed_price}
                onChange={(event) => setDraft({ ...draft, bundle_fixed_price: event.target.value })}
                disabled={draft.bundle_price_mode !== "fixed"}
              />
            </div>
            <div className="auth-field">
              <label>{t("outlets.campaigns.bundle.percent")}</label>
              <label className="checkbox">
                <input
                  type="radio"
                  name="bundlePricingProfile"
                  checked={draft.bundle_price_mode === "percent"}
                  onChange={() => setDraft({ ...draft, bundle_price_mode: "percent" })}
                />
                <span>{t("outlets.campaigns.bundle.percent")}</span>
              </label>
              <input
                className="input"
                type="number"
                value={draft.bundle_percent_discount}
                onChange={(event) =>
                  setDraft({ ...draft, bundle_percent_discount: event.target.value })
                }
                disabled={draft.bundle_price_mode !== "percent"}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="profile-section">
        <div className="profile-title">{t("outlets.campaigns.itemsTitle")}</div>
        <button className="button" type="button" onClick={() => openItemModal()}>
          {t("outlets.campaigns.addItem")}
        </button>
        {items.length === 0 ? (
          <div className="empty-state">{t("outlets.campaigns.itemsEmpty")}</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("outlets.campaigns.itemsTable.item")}</th>
                <th>{t("outlets.campaigns.itemsTable.qty")}</th>
                <th>{t("outlets.campaigns.itemsTable.required")}</th>
                {draft.type === "discount" ? (
                  <th>{t("outlets.campaigns.itemsTable.discount")}</th>
                ) : null}
                <th>{t("orders.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.item_id}>
                  <td>
                    {menuOptions.find((option) => Number(option.value) === item.item_id)?.label ||
                      item.item_id}
                  </td>
                  <td>{item.qty}</td>
                  <td>{item.required ? t("common.yes") : t("common.no")}</td>
                  {draft.type === "discount" ? (
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

      {warnings.length ? (
        <div className="banner warning">
          <div className="profile-title">{t("outlets.campaigns.warnings")}</div>
          <ul>
            {warnings.map((warning, index) => (
              <li key={String(index)}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="profile-section">
        <div className="profile-title">{t("outlets.campaigns.profile.actions")}</div>
        <div className="action-grid">
          <button className="button" type="button" onClick={saveCampaign} disabled={saving}>
            {t("common.save")}
          </button>
          <button className="button ghost" type="button" onClick={handleActivate}>
            {t("outlets.campaigns.activate")}
          </button>
          <button className="button ghost" type="button" onClick={handlePause}>
            {t("outlets.campaigns.pause")}
          </button>
          <button className="button ghost" type="button" onClick={handleArchive}>
            {t("outlets.campaigns.archive")}
          </button>
          <button className="button ghost" type="button" onClick={handleDuplicate}>
            {t("outlets.campaigns.duplicate")}
          </button>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.campaigns.orders")}</div>
        {ordersLoading ? (
          <div className="skeleton-block" />
        ) : orders.length === 0 ? (
          <div className="empty-state">{t("outlets.campaigns.ordersEmpty")}</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("outlets.campaigns.ordersTable.order")}</th>
                <th>{t("outlets.campaigns.ordersTable.client")}</th>
                <th>{t("outlets.campaigns.ordersTable.amount")}</th>
                <th>{t("outlets.campaigns.ordersTable.date")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row) => (
                <tr key={row.id}>
                  <td>{row.order_number || row.order_id}</td>
                  <td>{row.client_user_id || "-"}</td>
                  <td>{row.discount_amount || 0}</td>
                  <td>{row.applied_at || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="pagination">
          <button
            className="button"
            type="button"
            disabled={ordersPage <= 1}
            onClick={() => loadOrders(Math.max(1, ordersPage - 1))}
          >
            {t("common.back")}
          </button>
          <div className="helper-text">
            {t("common.page", { page: ordersPage, total: ordersTotalPages })}
          </div>
          <button
            className="button"
            type="button"
            disabled={ordersPage >= ordersTotalPages}
            onClick={() => loadOrders(Math.min(ordersTotalPages, ordersPage + 1))}
          >
            {t("common.next")}
          </button>
        </div>
      </div>

      <Modal
        open={Boolean(itemModal)}
        title={t("outlets.campaigns.itemTitle")}
        onClose={() => setItemModal(null)}
      >
        {itemModal ? (
          <form className="form-grid" onSubmit={saveItem}>
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
            {draft.type === "discount" ? (
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

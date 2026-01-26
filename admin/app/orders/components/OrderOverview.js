"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";
import OrderActions from "./OrderActions";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");
const formatCurrency = (value, t) =>
  value || value === 0 ? `${value} ${t("currency.sum")}` : "-";

const toDraftItems = (items) =>
  items.map((item, index) => ({
    ...item,
    clientId: item.id ?? `new-${index}-${Date.now()}`
  }));

const normalizeItemValue = (value) => Number(value || 0);

export default function OrderOverview({ order, role, onOrderUpdated }) {
  const { locale, t } = useLocale();
  const [activeItem, setActiveItem] = useState(null);
  const [toast, setToast] = useState(null);
  const items = Array.isArray(order.items) ? order.items : [];
  const [draftItems, setDraftItems] = useState(() => toDraftItems(items));
  const [saveComment, setSaveComment] = useState("");
  const [saving, setSaving] = useState(false);
  const subtotalFood = order.subtotal_food ?? 0;
  const deliveryFee = order.courier_fee ?? 0;
  const serviceFee = order.service_fee ?? 0;
  const discount = order.discount_amount ?? 0;
  const totalAmountBase =
    order.total_amount ??
    Math.max(0, subtotalFood + deliveryFee + serviceFee - discount);

  useEffect(() => {
    setDraftItems(toDraftItems(items));
  }, [order.items]);

  const hasChanges = useMemo(() => {
    if (draftItems.length !== items.length) {
      return true;
    }
    return draftItems.some((draft) => {
      if (!draft.id) {
        return true;
      }
      const original = items.find((item) => item.id === draft.id);
      if (!original) {
        return true;
      }
      return (
        draft.title !== original.title ||
        normalizeItemValue(draft.quantity) !== normalizeItemValue(original.quantity) ||
        normalizeItemValue(draft.unit_price) !== normalizeItemValue(original.unit_price) ||
        normalizeItemValue(draft.weight_grams) !== normalizeItemValue(original.weight_grams) ||
        (draft.description || "") !== (original.description || "") ||
        (draft.sku || "") !== (original.sku || "") ||
        (draft.photo_url || "") !== (original.photo_url || "")
      );
    });
  }, [draftItems, items]);

  const draftSubtotal = draftItems.reduce(
    (sum, item) =>
      sum +
      normalizeItemValue(item.unit_price) * normalizeItemValue(item.quantity),
    0
  );
  const subtotalFoodDisplay = hasChanges ? draftSubtotal : subtotalFood;
  const totalAmountDisplay = hasChanges
    ? Math.max(0, subtotalFoodDisplay + deliveryFee + serviceFee - discount)
    : totalAmountBase;
  const restaurantTotal = Math.max(0, subtotalFoodDisplay - discount);

  const handleItemChange = (clientId, field, value) => {
    setDraftItems((current) =>
      current.map((item) =>
        item.clientId === clientId
          ? {
              ...item,
              [field]:
                field === "quantity" ||
                field === "unit_price" ||
                field === "weight_grams"
                  ? Number(value)
                  : value
            }
          : item
      )
    );
  };

  const handleRemoveItem = (clientId) => {
    setDraftItems((current) => current.filter((item) => item.clientId !== clientId));
  };

  const handleAddItem = () => {
    setDraftItems((current) => [
      ...current,
      {
        clientId: `new-${Date.now()}`,
        title: "",
        description: "",
        photo_url: "",
        sku: "",
        weight_grams: 0,
        unit_price: 0,
        quantity: 1,
        total_price: 0
      }
    ]);
  };

  const handleSave = async () => {
    if (!saveComment.trim()) {
      setToast({ type: "error", message: t("orders.details.saveCommentRequired") });
      return;
    }
    setSaving(true);
    const payload = {
      comment: saveComment,
      items: draftItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        photo_url: item.photo_url,
        sku: item.sku,
        weight_grams: normalizeItemValue(item.weight_grams),
        unit_price: normalizeItemValue(item.unit_price),
        quantity: normalizeItemValue(item.quantity)
      }))
    };
    const result = await apiJson(`/api/orders/${order.id}/items`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setSaving(false);
      return;
    }
    setToast({ type: "success", message: t("orders.details.saveSuccess") });
    setSaveComment("");
    setSaving(false);
    if (onOrderUpdated) {
      onOrderUpdated(result.data);
    }
  };

  return (
    <>
      <div className="profile-grid">
        <section className="card profile-card">
          <div className="profile-title">{t("orders.overview.details")}</div>
          <div className="profile-row">
            <span className="muted">{t("orders.table.orderId")}</span>
            <span>{order.order_number}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.table.status")}</span>
            <span>{translateStatus(locale, order.status)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.sentToRestaurant")}</span>
            <span>{formatDate(order.sent_to_restaurant_at)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.promisedAt")}</span>
            <span>{formatDate(order.promised_delivery_at)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.deliveredAt")}</span>
            <span>{formatDate(order.delivered_at)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.table.amount")}</span>
            <span>{formatCurrency(totalAmountDisplay, t)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.overview.created")}</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
        </section>

        <section className="card profile-card">
          <div className="profile-title">{t("orders.overview.related")}</div>
          <div className="profile-row">
            <span className="muted">{t("orders.overview.client")}</span>
            <span>
              {order.client_name || "-"} ({order.client_phone || "-"})
            </span>
          </div>
          <div className="profile-row">
            <span className="muted">TG</span>
            <span>{order.client_username || order.client_tg_id || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.overview.courier")}</span>
            {order.courier_user_id ? (
              <Link className="action-link" href={`/couriers/${order.courier_user_id}`}>
                {order.courier_user_id}
              </Link>
            ) : (
              <span>-</span>
            )}
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.overview.restaurant")}</span>
            {order.outlet_id ? (
              <Link className="action-link" href={`/outlets/${order.outlet_id}`}>
                {order.outlet_name || order.outlet_id}
              </Link>
            ) : (
              <span>{order.outlet_name || "-"}</span>
            )}
          </div>
        </section>

        <section className="card profile-card">
          <div className="profile-title">{t("orders.details.address")}</div>
          <div className="profile-row">
            <span className="muted">{t("orders.overview.address")}</span>
            <span>{order.delivery_address || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.addressComment")}</span>
            <span>{order.delivery_address_comment || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.entrance")}</span>
            <span>{order.address_entrance || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.floor")}</span>
            <span>{order.address_floor || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.apartment")}</span>
            <span>{order.address_apartment || "-"}</span>
          </div>
        </section>

        <section className="card profile-card">
          <div className="profile-title">{t("orders.details.recipient")}</div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.forOther")}</span>
            <span>{order.is_for_other ? t("common.yes") : t("common.no")}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.receiverName")}</span>
            <span>{order.receiver_name || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.receiverPhone")}</span>
            <span>{order.receiver_phone || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.ordererPhone")}</span>
            <span>{order.orderer_phone || order.client_phone || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.utensils")}</span>
            <span>{order.utensils_count ?? "-"}</span>
          </div>
        </section>

        <section className="card profile-card">
          <div className="profile-title">{t("orders.details.comments")}</div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.commentRestaurant")}</span>
            <span>{order.comment_to_restaurant || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.commentAddress")}</span>
            <span>{order.comment_to_address || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.commentCrm")}</span>
            <span>{order.crm_comment || "-"}</span>
          </div>
        </section>

        <section className="card profile-card">
          <div className="profile-title">{t("orders.details.payment")}</div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.subtotalFood")}</span>
            <span>{formatCurrency(subtotalFoodDisplay, t)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.deliveryFee")}</span>
            <span>{formatCurrency(deliveryFee, t)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.serviceFee")}</span>
            <span>{formatCurrency(serviceFee, t)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.discount")}</span>
            <span>{formatCurrency(discount, t)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.promoCode")}</span>
            <span>{order.promo_code || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.total")}</span>
            <span>{formatCurrency(totalAmountDisplay, t)}</span>
          </div>
          <div className="profile-row">
            <span className="muted">{t("orders.details.restaurantTotal")}</span>
            <span>{formatCurrency(restaurantTotal, t)}</span>
          </div>
        </section>

        <section className="card profile-card">
          <div className="profile-title">{t("orders.details.items")}</div>
          {draftItems.length === 0 ? (
            <div className="empty-state">{t("orders.details.itemsEmpty")}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("orders.details.itemsTable.title")}</th>
                  <th>{t("orders.details.itemsTable.quantity")}</th>
                  <th>{t("orders.details.itemsTable.weight")}</th>
                  <th>{t("orders.details.itemsTable.unitPrice")}</th>
                  <th>{t("orders.details.itemsTable.total")}</th>
                  <th>{t("orders.details.itemsTable.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {draftItems.map((item) => {
                  const total =
                    normalizeItemValue(item.unit_price) *
                    normalizeItemValue(item.quantity);
                  return (
                    <tr key={item.clientId}>
                      <td>
                        <input
                          className="input"
                          value={item.title}
                          onChange={(event) =>
                            handleItemChange(item.clientId, "title", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            handleItemChange(
                              item.clientId,
                              "quantity",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={item.weight_grams}
                          onChange={(event) =>
                            handleItemChange(
                              item.clientId,
                              "weight_grams",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(event) =>
                            handleItemChange(
                              item.clientId,
                              "unit_price",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td>{formatCurrency(total, t)}</td>
                      <td>
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => setActiveItem(item)}
                        >
                          {t("orders.details.itemsTable.info")}
                        </button>
                        <button
                          className="link-button danger"
                          type="button"
                          onClick={() => handleRemoveItem(item.clientId)}
                        >
                          {t("orders.details.itemsTable.remove")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="modal-actions">
            <button className="button" type="button" onClick={handleAddItem}>
              {t("orders.details.itemsTable.add")}
            </button>
          </div>
        </section>

        <section className="card profile-card">
          <div className="profile-title">{t("orders.details.saveTitle")}</div>
          <div className="auth-field">
            <label htmlFor="orderSaveComment">
              {t("orders.details.saveComment")}
            </label>
            <textarea
              id="orderSaveComment"
              className="input"
              value={saveComment}
              onChange={(event) => setSaveComment(event.target.value)}
              placeholder={t("orders.details.saveCommentPlaceholder")}
            />
          </div>
          <div className="modal-actions">
            <button
              className="button"
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? t("orders.details.savePending") : t("orders.details.saveOrder")}
            </button>
          </div>
        </section>

        <OrderActions
          orderId={order.id}
          role={role}
          titleKey="orders.support.actionsTitle"
          onCancelled={onOrderUpdated}
        />
      </div>

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {activeItem ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{activeItem.title}</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setActiveItem(null)}
              >
                ×
              </button>
            </div>
            {activeItem.photo_url ? (
              <img
                className="modal-media"
                src={activeItem.photo_url}
                alt={activeItem.title}
              />
            ) : null}
            <div className="profile-row">
              <span className="muted">{t("orders.details.itemDescription")}</span>
              <span>{activeItem.description || "-"}</span>
            </div>
            <div className="profile-row">
              <span className="muted">{t("orders.details.itemSku")}</span>
              <span>{activeItem.sku || "-"}</span>
            </div>
            <div className="profile-row">
              <span className="muted">{t("orders.details.itemsTable.weight")}</span>
              <span>
                {activeItem.weight_grams ? `${activeItem.weight_grams}g` : "-"}
              </span>
            </div>
            <div className="modal-actions">
              <button
                className="button"
                type="button"
                onClick={() => setActiveItem(null)}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

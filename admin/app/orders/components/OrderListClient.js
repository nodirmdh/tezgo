"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const statusOptions = [
  "",
  "created",
  "pending_partner",
  "accepted",
  "accepted_by_restaurant",
  "preparing",
  "ready",
  "ready_for_pickup",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "closed",
  "rejected"
];

const sortOptions = [
  { value: "created_at:desc", labelKey: "orders.sort.newest" },
  { value: "created_at:asc", labelKey: "orders.sort.oldest" },
  { value: "severity:desc", labelKey: "orders.sort.problematic" }
];


export default function OrderListClient() {
  const { locale, t } = useLocale();
  const [filters, setFilters] = useState({
    q: "",
    phone: "",
    status: "",
    outlet_id: "",
    courier_user_id: "",
    fulfillment_type: "",
    date_from: "",
    date_to: "",
    hasProblem: false,
    sort: sortOptions[0].value,
    page: 1,
    limit: 10
  });
  const [savedViews, setSavedViews] = useState([]);
  const [viewName, setViewName] = useState("");
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [assignCourierId, setAssignCourierId] = useState("");
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSource, setCancelSource] = useState("support");
  const [cancelPenalty, setCancelPenalty] = useState("");
  const exportParams = useMemo(() => {
    return new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (value === "" || value === null || value === false) {
          return acc;
        }
        acc[key] = String(value);
        return acc;
      }, {})
    ).toString();
  }, [filters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("orders_saved_views_v1");
    if (!stored) return;
    try {
      setSavedViews(JSON.parse(stored));
    } catch {
      setSavedViews([]);
    }
  }, []);

  const persistViews = (views) => {
    setSavedViews(views);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("orders_saved_views_v1", JSON.stringify(views));
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))),
    [data.total, data.limit]
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (value === "" || value === null || value === false) {
          return acc;
        }
        acc[key] = String(value);
        return acc;
      }, {})
    ).toString();
    const result = await apiJson(`/admin/orders?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder={t("orders.filters.searchOrder")}
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            placeholder={t("orders.filters.phone")}
            value={filters.phone}
            onChange={(event) =>
              setFilters({ ...filters, phone: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value, page: 1 })
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status ? translateStatus(locale, status) : t("orders.filters.allStatuses")}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder={t("orders.filters.outletId")}
            value={filters.outlet_id}
            onChange={(event) =>
              setFilters({ ...filters, outlet_id: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            placeholder={t("orders.filters.courierId")}
            value={filters.courier_user_id}
            onChange={(event) =>
              setFilters({
                ...filters,
                courier_user_id: event.target.value,
                page: 1
              })
            }
          />
          <select
            className="select"
            value={filters.fulfillment_type}
            onChange={(event) =>
              setFilters({
                ...filters,
                fulfillment_type: event.target.value,
                page: 1
              })
            }
          >
            <option value="">{t("orders.filters.allFulfillment")}</option>
            <option value="delivery">{t("orders.filters.delivery")}</option>
            <option value="pickup">{t("orders.filters.pickup")}</option>
          </select>
          <input
            className="input"
            type="date"
            value={filters.date_from}
            onChange={(event) =>
              setFilters({ ...filters, date_from: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            type="date"
            value={filters.date_to}
            onChange={(event) =>
              setFilters({ ...filters, date_to: event.target.value, page: 1 })
            }
          />
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
          <label className="checkbox">
            <input
              type="checkbox"
              checked={filters.hasProblem}
              onChange={(event) =>
                setFilters({ ...filters, hasProblem: event.target.checked, page: 1 })
              }
            />
            {t("orders.filters.problematic")}
          </label>
          <button
            className="button ghost"
            type="button"
            onClick={() => {
              const name = viewName.trim();
              if (!name) {
                setToast({ type: "error", message: t("orders.views.nameRequired") });
                return;
              }
              const next = [
                ...savedViews.filter((view) => view.name !== name),
                { name, filters: { ...filters, page: 1 } }
              ];
              persistViews(next);
              setViewName("");
              setToast({ type: "success", message: t("orders.views.saved") });
            }}
          >
            {t("orders.views.save")}
          </button>
          <select
            className="select"
            value=""
            onChange={(event) => {
              const selected = savedViews.find((view) => view.name === event.target.value);
              if (selected) {
                setFilters({ ...selected.filters, page: 1 });
              }
            }}
          >
            <option value="">{t("orders.views.savedViews")}</option>
            {savedViews.map((view) => (
              <option key={view.name} value={view.name}>
                {view.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder={t("orders.views.namePlaceholder")}
            value={viewName}
            onChange={(event) => setViewName(event.target.value)}
          />
          <a
            className="button ghost"
            href={`/admin/orders/export?${exportParams}`}
            target="_blank"
            rel="noreferrer"
          >
            {t("orders.export")}
          </a>
        </div>
      </div>

      {error ? <div className="banner error">{t(error)}</div> : null}
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
              <th>{t("orders.table.orderId")}</th>
              <th>{t("orders.table.date")}</th>
              <th>{t("orders.table.restaurant")}</th>
              <th>{t("orders.table.partner")}</th>
              <th>{t("orders.table.fulfillment")}</th>
              <th>{t("orders.table.amount")}</th>
              <th>{t("orders.table.status")}</th>
              <th>{t("orders.table.courier")}</th>
              <th>{t("orders.table.problems")}</th>
              <th>{t("orders.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{order.created_at}</td>
                <td>{order.outlet_name || "-"}</td>
                <td>{order.partner_name || "-"}</td>
                <td>{order.fulfillment_type || "-"}</td>
                <td>
                  {order.total_amount
                    ? `${order.total_amount} ${t("currency.sum")}`
                    : "-"}
                </td>
                <td>
                  <span className="badge">{translateStatus(locale, order.status)}</span>
                </td>
                <td>{order.courier_user_id ?? "-"}</td>
                <td>
                  {order.problems_count > 0 ? (
                    <span className="badge severity high">{order.problems_count}</span>
                  ) : (
                    <span className="badge">{t("orders.table.ok")}</span>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/orders/${order.id}`}>
                      {t("common.view")}
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => {
                        setAssigningOrder(order);
                        setAssignCourierId(order.courier_user_id || "");
                      }}
                    >
                      {t("orders.actions.assignCourier")}
                    </button>
                    <button
                      className="action-link danger"
                      type="button"
                      onClick={() => {
                        setCancelOrder(order);
                        setCancelReason("");
                        setCancelPenalty("");
                      }}
                    >
                      {t("orders.actions.cancel")}
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
            setFilters({
              ...filters,
              page: Math.min(totalPages, filters.page + 1)
            })
          }
        >
          {t("common.next")}
        </button>
      </div>

      {assigningOrder ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{t("orders.actions.assignCourier")}</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setAssigningOrder(null)}
              >
                x
              </button>
            </div>
            <div className="form-grid">
              <div className="auth-field">
                <label htmlFor="assignCourier">{t("orders.support.courierId")}</label>
                <input
                  id="assignCourier"
                  className="input"
                  value={assignCourierId}
                  onChange={(event) => setAssignCourierId(event.target.value)}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="button"
                type="button"
                onClick={async () => {
                  const result = await apiJson(
                    `/admin/orders/${assigningOrder.id}/assign-courier`,
                    {
                      method: "POST",
                      body: JSON.stringify({ courierUserId: Number(assignCourierId) })
                    }
                  );
                  if (!result.ok) {
                    setToast({ type: "error", message: t(result.error) });
                    return;
                  }
                  setToast({ type: "success", message: t("orders.support.reassigned") });
                  setAssigningOrder(null);
                  fetchOrders();
                }}
              >
                {t("orders.actions.assignCourier")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cancelOrder ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{t("orders.actions.cancel")}</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setCancelOrder(null)}
              >
                x
              </button>
            </div>
            <div className="form-grid">
              <div className="auth-field">
                <label htmlFor="cancelReason">{t("orders.support.cancelReason")}</label>
                <input
                  id="cancelReason"
                  className="input"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                />
              </div>
              <div className="form-row two">
                <div className="auth-field">
                  <label htmlFor="cancelSource">{t("orders.support.cancelSource")}</label>
                  <select
                    id="cancelSource"
                    className="select"
                    value={cancelSource}
                    onChange={(event) => setCancelSource(event.target.value)}
                  >
                    <option value="support">{t("orders.support.cancelSourceSupport")}</option>
                    <option value="client">{t("orders.support.cancelSourceClient")}</option>
                    <option value="partner">{t("orders.support.cancelSourcePartner")}</option>
                    <option value="system">{t("orders.support.cancelSourceSystem")}</option>
                  </select>
                </div>
                <div className="auth-field">
                  <label htmlFor="cancelPenalty">{t("orders.support.penaltyAmount")}</label>
                  <input
                    id="cancelPenalty"
                    className="input"
                    type="number"
                    min="0"
                    value={cancelPenalty}
                    onChange={(event) => setCancelPenalty(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="button danger"
                type="button"
                onClick={async () => {
                  if (!cancelReason.trim()) {
                    setToast({ type: "error", message: t("orders.support.cancelReasonRequired") });
                    return;
                  }
                  const result = await apiJson(`/admin/orders/${cancelOrder.id}/cancel`, {
                    method: "POST",
                    body: JSON.stringify({
                      reason: cancelReason.trim(),
                      source: cancelSource,
                      penalty_amount: cancelPenalty ? Number(cancelPenalty) : 0
                    })
                  });
                  if (!result.ok) {
                    setToast({ type: "error", message: t(result.error) });
                    return;
                  }
                  setToast({ type: "success", message: t("orders.support.cancelled") });
                  setCancelOrder(null);
                  fetchOrders();
                }}
              >
                {t("orders.actions.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}


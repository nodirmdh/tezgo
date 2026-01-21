"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const statusOptions = [
  "",
  "accepted_by_system",
  "accepted_by_restaurant",
  "ready_for_pickup",
  "picked_up",
  "delivered",
  "cancelled"
];

const sortOptions = [
  { value: "created_at:desc", labelKey: "orders.sort.newest" },
  { value: "created_at:asc", labelKey: "orders.sort.oldest" },
  { value: "severity:desc", labelKey: "orders.sort.problematic" }
];

const formatMinutes = (value) => (value === null || value === undefined ? "-" : `${value}m`);

const renderSla = (summary) => {
  if (!summary) return "-";
  return `CS:${formatMinutes(summary.courierSearchMinutes)} Cook:${formatMinutes(
    summary.cookingMinutes
  )} Pick:${formatMinutes(summary.waitingPickupMinutes)} Del:${formatMinutes(
    summary.deliveryMinutes
  )}`;
};

export default function OrderListClient() {
  const { locale, t } = useLocale();
  const [filters, setFilters] = useState({
    q: "",
    phone: "",
    status: "",
    outlet_id: "",
    courier_user_id: "",
    date_from: "",
    date_to: "",
    problematic: false,
    sort: sortOptions[0].value,
    page: 1,
    limit: 10
  });
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

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
    const result = await apiJson(`/api/orders/list?${params}`);
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
              checked={filters.problematic}
              onChange={(event) =>
                setFilters({ ...filters, problematic: event.target.checked, page: 1 })
              }
            />
            {t("orders.filters.problematic")}
          </label>
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
              <th>{t("orders.table.amount")}</th>
              <th>{t("orders.table.status")}</th>
              <th>{t("orders.table.courier")}</th>
              <th>{t("orders.table.phone")}</th>
              <th>{t("orders.table.sla")}</th>
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
                <td>
                  {order.total_amount
                    ? `${order.total_amount} ${t("currency.sum")}`
                    : "-"}
                </td>
                <td>
                  <span className="badge">{translateStatus(locale, order.status)}</span>
                </td>
                <td>{order.courier_user_id ?? "-"}</td>
                <td>{order.client_phone || "-"}</td>
                <td className="mono">{renderSla(order.slaSummary)}</td>
                <td>
                  {order.problemsCount > 0 ? (
                    <Link
                      className={`badge severity ${order.overallSeverity}`}
                      href={`/orders/${order.id}?tab=timeline`}
                      title={order.primaryProblemTitle || ""}
                    >
                      {t(`orders.severity.${order.overallSeverity}`, {
                        defaultValue: order.overallSeverity
                      })}{" "}
                      ({order.problemsCount})
                    </Link>
                  ) : (
                    <span className="badge">{t("orders.table.ok")}</span>
                  )}
                </td>
                <td>
                  <Link className="action-link" href={`/orders/${order.id}`}>
                    {t("common.view")}
                  </Link>
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
    </section>
  );
}

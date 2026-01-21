"use client";

import Link from "next/link";
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

export default function CourierOrders({
  data,
  filters,
  loading,
  error,
  onFilterChange,
  onPageChange
}) {
  const { locale, t } = useLocale();
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10)));

  return (
    <section className="card profile-card">
      <div className="profile-title">{t("tabs.orders")}</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder={t("orders.filters.searchOrder")}
            value={filters.q}
            onChange={(event) =>
              onFilterChange({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                status: event.target.value,
                page: 1
              })
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status ? translateStatus(locale, status) : t("orders.filters.allStatuses")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.items.length === 0 ? (
        <div className="empty-state">{t("dashboard.noData")}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("orders.table.orderId")}</th>
              <th>{t("orders.table.date")}</th>
              <th>{t("orders.table.restaurant")}</th>
              <th>{t("orders.table.amount")}</th>
              <th>{t("orders.table.status")}</th>
              <th>{t("orders.overview.address")}</th>
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
                <td>{order.delivery_address || "-"}</td>
                <td>
                  <Link className="action-link" href={`/orders/${order.id}`}>
                    {t("orders.actions.open")}
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
          onClick={() => onPageChange(Math.max(1, filters.page - 1))}
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
          onClick={() => onPageChange(Math.min(totalPages, filters.page + 1))}
        >
          {t("common.next")}
        </button>
      </div>
    </section>
  );
}

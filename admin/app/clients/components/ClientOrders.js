"use client";

import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const statusOptions = [
  "",
  "accepted_by_system",
  "accepted_by_restaurant",
  "ready_for_pickup",
  "picked_up",
  "delivered"
];

export default function ClientOrders({
  data,
  filters,
  onFilterChange,
  onPageChange,
  loading,
  error
}) {
  const { locale, t } = useLocale();
  const totalPages = Math.max(
    1,
    Math.ceil((data.total || 0) / (data.limit || 10))
  );

  return (
    <section className="card profile-card">
      <div className="profile-title">{t("clients.orders.title")}</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder={t("clients.orders.searchPlaceholder")}
            value={filters.q}
            onChange={(event) =>
              onFilterChange({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              onFilterChange({ ...filters, status: event.target.value, page: 1 })
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status
                  ? translateStatus(locale, status)
                  : t("clients.orders.allStatuses")}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>OrderId</th>
              <th>{t("orders.table.date")}</th>
              <th>{t("orders.table.restaurant")}</th>
              <th>{t("orders.table.amount")}</th>
              <th>{t("orders.table.status")}</th>
              <th>{t("orders.table.courier")}</th>
              <th>{t("orders.overview.address")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{formatDate(order.created_at)}</td>
                <td>{order.outlet_name || "-"}</td>
                <td>
                  {order.total_amount
                    ? `${order.total_amount} ${t("currency.sum")}`
                    : "-"}
                </td>
                <td>
                  <span className="badge">
                    {translateStatus(locale, order.status)}
                  </span>
                </td>
                <td>{order.courier_user_id ?? "-"}</td>
                <td>{order.delivery_address ?? "-"}</td>
                <td>
                  <button className="action-link" type="button">
                    {t("orders.actions.open")}
                  </button>
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
          onClick={() => onPageChange(Math.max(1, filters.page - 1))}
          disabled={filters.page <= 1}
        >
          {t("common.back")}
        </button>
        <div className="helper-text">
          {t("common.page", { page: filters.page, total: totalPages })}
        </div>
        <button
          className="button"
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, filters.page + 1))}
          disabled={filters.page >= totalPages}
        >
          {t("common.next")}
        </button>
      </div>
    </section>
  );
}

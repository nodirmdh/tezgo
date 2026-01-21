"use client";

import { useRouter } from "next/navigation";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const statusOptions = [
  "",
  "accepted_by_system",
  "accepted_by_restaurant",
  "ready_for_pickup",
  "picked_up",
  "delivered"
];

export default function UserOrders({
  data,
  filters,
  loading,
  error,
  onFilterChange,
  onPageChange
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size));

  return (
    <section className="card profile-card">
      <div className="profile-title">{t("users.orders.title")}</div>
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder={t("users.orders.searchPlaceholder")}
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
                  : t("users.orders.allStatuses")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="form-grid">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("users.orders.table.datetime")}</th>
              <th>{t("users.orders.table.outlet")}</th>
              <th>{t("users.orders.table.amount")}</th>
              <th>{t("users.orders.table.status")}</th>
              <th>{t("users.orders.table.courier")}</th>
              <th>{t("users.orders.table.address")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr
                key={order.id}
                className="clickable-row"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/orders/${order.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/orders/${order.id}`);
                  }
                }}
              >
                <td>{order.created_at || "-"}</td>
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
                <td>{order.courier_name || "-"}</td>
                <td>{order.delivery_address || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button
          className="button ghost"
          type="button"
          onClick={() => onPageChange(Math.max(1, filters.page - 1))}
          disabled={filters.page <= 1}
        >
          {t("common.back")}
        </button>
        <span>{t("common.page", { page: filters.page, total: totalPages })}</span>
        <button
          className="button ghost"
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

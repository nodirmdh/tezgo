"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";

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
  { value: "created_at:desc", label: "Новые сначала" },
  { value: "created_at:asc", label: "Старые сначала" },
  { value: "severity:desc", label: "Problematic first" }
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
            placeholder="Поиск по orderId"
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            placeholder="Телефон клиента"
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
            <option value="">Все статусы</option>
            {statusOptions
              .filter((item) => item)
              .map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
          </select>
          <input
            className="input"
            placeholder="Outlet ID"
            value={filters.outlet_id}
            onChange={(event) =>
              setFilters({ ...filters, outlet_id: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            placeholder="Courier ID"
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
                {option.label}
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
            Problematic
          </label>
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
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
              <th>Order ID</th>
              <th>Дата</th>
              <th>Ресторан</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Курьер</th>
              <th>Телефон</th>
              <th>SLA</th>
              <th>Problems</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{order.created_at}</td>
                <td>{order.outlet_name || "-"}</td>
                <td>{order.total_amount ? `${order.total_amount} сум` : "-"}</td>
                <td>
                  <span className="badge">{order.status}</span>
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
                      {order.overallSeverity} ({order.problemsCount})
                    </Link>
                  ) : (
                    <span className="badge">ok</span>
                  )}
                </td>
                <td>
                  <Link className="action-link" href={`/orders/${order.id}`}>
                    View
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
          Назад
        </button>
        <div className="helper-text">
          Страница {filters.page} из {totalPages}
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
          Вперёд
        </button>
      </div>
    </section>
  );
}

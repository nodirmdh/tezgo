"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

export default function CourierListClient() {
  const { locale, t } = useLocale();
  const [filters, setFilters] = useState({
    status: "",
    blocked: "",
    page: 1,
    limit: 10
  });
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, dialog } = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))),
    [data.total, data.limit]
  );

  const fetchCouriers = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      status: filters.status,
      blocked: filters.blocked,
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/couriers/list?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchCouriers, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleBlockToggle = async (courier) => {
    const nextStatus = courier.user_status === "blocked" ? "active" : "blocked";
    confirm({
      title:
        nextStatus === "blocked"
          ? t("couriers.actions.blockConfirm")
          : t("couriers.actions.unblockConfirm"),
      description: t("couriers.actions.confirmDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/couriers/${courier.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("couriers.toasts.statusUpdated") });
        fetchCouriers();
      }
    });
  };

  const formatName = (item) =>
    item.username || item.tg_id || `${t("couriers.profile.title")} #${item.id}`;
  const formatRating = (item) =>
    item.rating_avg ? `${Number(item.rating_avg).toFixed(1)} (${item.rating_count || 0})` : "-";

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="toolbar">
        <div className="toolbar-actions">
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value, page: 1 })
            }
          >
            <option value="">{t("couriers.filters.allStatuses")}</option>
            <option value="online">{t("couriers.status.online")}</option>
            <option value="offline">{t("couriers.status.offline")}</option>
          </select>
          <select
            className="select"
            value={filters.blocked}
            onChange={(event) =>
              setFilters({ ...filters, blocked: event.target.value, page: 1 })
            }
          >
            <option value="">{t("couriers.filters.allBlocked")}</option>
            <option value="true">{translateStatus(locale, "blocked")}</option>
            <option value="false">{translateStatus(locale, "active")}</option>
          </select>
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
              <th>{t("couriers.table.courier")}</th>
              <th>{t("couriers.table.phone")}</th>
              <th>{t("couriers.table.status")}</th>
              <th>{t("couriers.table.rating")}</th>
              <th>{t("couriers.table.ordersToday")}</th>
              <th>{t("couriers.table.blocked")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((courier) => (
              <tr key={courier.id}>
                <td>{formatName(courier)}</td>
                <td>{courier.phone || "-"}</td>
                <td>
                  <span className="badge">
                    {courier.is_active ? t("couriers.status.online") : t("couriers.status.offline")}
                  </span>
                </td>
                <td>{formatRating(courier)}</td>
                <td>{courier.orders_today}</td>
                <td>
                  <span className="badge">
                    {translateStatus(locale, courier.user_status || "active")}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/couriers/${courier.id}`}>
                      {t("common.view")}
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleBlockToggle(courier)}
                    >
                      {courier.user_status === "blocked"
                        ? t("couriers.actions.unblock")
                        : t("couriers.actions.block")}
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
    </section>
  );
}

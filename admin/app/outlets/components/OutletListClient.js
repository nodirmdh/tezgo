"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

export default function OutletListClient() {
  const { t } = useLocale();
  const [filters, setFilters] = useState({
    q: "",
    type: "",
    status: "",
    partner_id: "",
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

  const fetchOutlets = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: filters.q,
      type: filters.type,
      status: filters.status,
      partner_id: filters.partner_id,
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/outlets/list?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchOutlets, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleStatusToggle = async (outlet, status) => {
    let reason = null;
    if (status === "closed") {
      reason = window.prompt(t("outlets.confirm.reasonPlaceholder"), "");
      if (!reason) {
        return;
      }
    }
    const statusLabel = t(`outlets.status.${status}`, { defaultValue: status });
    confirm({
      title: t("outlets.confirm.statusTitle", { status: statusLabel }),
      description: t("outlets.confirm.statusDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/outlets/${outlet.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status, status_reason: reason })
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.toasts.statusUpdated") });
        fetchOutlets();
      }
    });
  };

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
          <input
            className="input"
            placeholder={t("outlets.searchPlaceholder")}
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <input
            className="input"
            placeholder={t("outlets.filters.partnerId")}
            value={filters.partner_id}
            onChange={(event) =>
              setFilters({ ...filters, partner_id: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.type}
            onChange={(event) =>
              setFilters({ ...filters, type: event.target.value, page: 1 })
            }
          >
            <option value="">{t("outlets.filters.allTypes")}</option>
            <option value="restaurant">{t("outlets.filters.restaurant")}</option>
            <option value="shop">{t("outlets.filters.shop")}</option>
          </select>
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value, page: 1 })
            }
          >
            <option value="">{t("outlets.filters.allStatuses")}</option>
            <option value="open">{t("outlets.status.open")}</option>
            <option value="closed">{t("outlets.status.closed")}</option>
            <option value="blocked">{t("outlets.status.blocked")}</option>
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
              <th>{t("outlets.table.outlet")}</th>
              <th>{t("outlets.table.partner")}</th>
              <th>{t("outlets.table.address")}</th>
              <th>{t("outlets.table.status")}</th>
              <th>{t("outlets.table.openClose")}</th>
              <th>{t("orders.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((outlet) => (
              <tr key={outlet.id}>
                <td>{outlet.name}</td>
                <td>{outlet.partner_name || "-"}</td>
                <td>{outlet.address || "-"}</td>
                <td>
                  <span className="badge">{t(`outlets.status.${outlet.status || "open"}`)}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="action-link"
                      type="button"
                      onClick={() =>
                        handleStatusToggle(outlet, outlet.status === "open" ? "closed" : "open")
                      }
                    >
                      {outlet.status === "open"
                        ? t("outlets.actions.tempDisable")
                        : t("outlets.actions.activate")}
                    </button>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleStatusToggle(outlet, "blocked")}
                    >
                      {t("outlets.actions.block")}
                    </button>
                  </div>
                </td>
                <td>
                  <Link className="action-link" href={`/outlets/${outlet.id}`}>
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

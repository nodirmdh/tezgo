"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

export default function PartnerListClient() {
  const { locale, t } = useLocale();
  const [filters, setFilters] = useState({ q: "", status: "", page: 1, limit: 10 });
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, dialog } = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))),
    [data.total, data.limit]
  );

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: filters.q,
      status: filters.status,
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/partners/list?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchPartners, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleBlockToggle = async (partner) => {
    const nextStatus = partner.status === "blocked" ? "active" : "blocked";
    confirm({
      title:
        nextStatus === "blocked"
          ? t("partners.actions.blockConfirm")
          : t("partners.actions.unblockConfirm"),
      description: t("partners.actions.confirmDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/partners/${partner.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("partners.toasts.statusUpdated") });
        fetchPartners();
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
            placeholder={t("partners.searchPlaceholder")}
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value, page: 1 })
            }
          >
            <option value="">{t("partners.allStatuses")}</option>
            {["active", "blocked"].map((status) => (
              <option key={status} value={status}>
                {translateStatus(locale, status)}
              </option>
            ))}
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
              <th>{t("partners.table.partner")}</th>
              <th>{t("partners.table.status")}</th>
              <th>{t("partners.table.outlets")}</th>
              <th>{t("partners.table.manager")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((partner) => (
              <tr key={partner.id}>
                <td>{partner.name}</td>
                <td>
                  <span className="badge">{translateStatus(locale, partner.status || "active")}</span>
                </td>
                <td>{partner.outlets_count}</td>
                <td>{partner.manager || "-"}</td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/partners/${partner.id}`}>
                      {t("common.view")}
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleBlockToggle(partner)}
                    >
                      {partner.status === "blocked"
                        ? t("partners.actions.unblock")
                        : t("partners.actions.block")}
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

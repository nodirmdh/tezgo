"use client";

import Link from "next/link";
import { useLocale } from "../../components/LocaleProvider";

export default function PartnerOutlets({
  data,
  filters,
  loading,
  error,
  onPageChange
}) {
  const { t } = useLocale();
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10)));

  return (
    <section className="card profile-card">
      <div className="profile-title">{t("tabs.outlets")}</div>
      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.items.length === 0 ? (
        <div className="empty-state">{t("dashboard.noData")}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("outlets.table.outlet")}</th>
              <th>{t("outlets.table.type")}</th>
              <th>{t("outlets.table.address")}</th>
              <th>{t("outlets.table.status")}</th>
              <th>{t("orders.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((outlet) => (
              <tr key={outlet.id}>
                <td>{outlet.name}</td>
                <td>{outlet.type}</td>
                <td>{outlet.address || "-"}</td>
                <td>
                  <span className="badge">{outlet.status || "open"}</span>
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

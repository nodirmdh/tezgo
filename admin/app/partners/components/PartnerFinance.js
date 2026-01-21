"use client";

import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const formatCurrency = (value, t) =>
  value || value === 0 ? `${value} ${t("currency.sum")}` : "-";

export default function PartnerFinance({ data, loading, error }) {
  const { locale, t } = useLocale();

  return (
    <section className="card profile-card">
      <div className="profile-title">{t("tabs.finance")}</div>
      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : (
        <>
          <div className="cards">
            {data.summary.map((item) => (
              <div key={item.type} className="card">
                <div style={{ color: "#64748B", fontSize: "13px" }}>
                  {t(`partners.finance.summary.${item.type}`)}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 600, marginTop: "6px" }}>
                  {formatCurrency(item.value, t)}
                </div>
              </div>
            ))}
          </div>
          {data.transactions.length === 0 ? (
            <div className="empty-state">{t("dashboard.noData")}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("finance.table.title")}</th>
                  <th>{t("finance.table.amount")}</th>
                  <th>{t("finance.table.status")}</th>
                  <th>{t("finance.table.date")}</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((row) => (
                  <tr key={row.id ?? row.title}>
                    <td>{row.title}</td>
                    <td>{formatCurrency(row.amount, t)}</td>
                    <td>
                      <span className="badge">{translateStatus(locale, row.status)}</span>
                    </td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}

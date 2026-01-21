"use client";

import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

export default function CourierFinance({ data, loading, error }) {
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
              <div key={item.label || item.type} className="card">
                <div style={{ color: "#64748B", fontSize: "13px" }}>
                  {item.label || item.type}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 600, marginTop: "6px" }}>
                  {item.value ?? item.amount ?? "-"}
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
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((row) => (
                  <tr key={row.id ?? row.title}>
                    <td>{row.title}</td>
                    <td>{row.amount}</td>
                    <td>
                      <span className="badge">{translateStatus(locale, row.status)}</span>
                    </td>
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

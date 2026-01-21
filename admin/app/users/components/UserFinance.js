"use client";

import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

export default function UserFinance({ data, loading, error }) {
  const { locale, t } = useLocale();

  if (loading) {
    return (
      <div className="form-grid">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="skeleton-row" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="banner error">{t(error)}</div>;
  }

  return (
    <section className="card profile-card">
      <div className="profile-title">{t("users.finance.title")}</div>
      <div className="cards compact">
        {(data.summary || []).map((item) => (
          <div key={item.type} className="card">
            <div style={{ color: "#64748B", fontSize: "13px" }}>
              {t(`users.finance.summary.${item.type}`, { defaultValue: item.type })}
            </div>
            <div className="card-value">{item.value}</div>
          </div>
        ))}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>{t("users.finance.table.transaction")}</th>
            <th>{t("users.finance.table.amount")}</th>
            <th>{t("users.finance.table.status")}</th>
            <th>{t("users.finance.table.date")}</th>
          </tr>
        </thead>
        <tbody>
          {(data.transactions || []).map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.amount}</td>
              <td>
                <span className="badge">
                  {translateStatus(locale, item.status)}
                </span>
              </td>
              <td>{item.created_at || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

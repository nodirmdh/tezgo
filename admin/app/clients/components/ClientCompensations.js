"use client";

import { useLocale } from "../../components/LocaleProvider";

export default function ClientCompensations({ data, loading, error }) {
  const { t } = useLocale();

  if (loading) {
    return <div className="skeleton-block" />;
  }

  if (error) {
    return <div className="banner error">{t(error)}</div>;
  }

  if (!data.length) {
    return <div className="empty-state">{t("clients.compensations.empty")}</div>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>{t("clients.compensations.table.title")}</th>
          <th>{t("clients.compensations.table.amount")}</th>
          <th>{t("clients.compensations.table.type")}</th>
          <th>{t("clients.compensations.table.order")}</th>
          <th>{t("clients.compensations.table.date")}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td>{item.title}</td>
            <td>{item.amount}</td>
            <td>{item.type}</td>
            <td>{item.order_id || "-"}</td>
            <td>{item.created_at || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

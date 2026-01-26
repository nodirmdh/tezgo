"use client";

import { useLocale } from "../../components/LocaleProvider";

export default function ClientMessages({ data, loading, error }) {
  const { t } = useLocale();

  if (loading) {
    return <div className="skeleton-block" />;
  }

  if (error) {
    return <div className="banner error">{t(error)}</div>;
  }

  if (!data.length) {
    return <div className="empty-state">{t("clients.messages.empty")}</div>;
  }

  return (
    <ul className="log-list">
      {data.map((item) => (
        <li key={item.id} className="log-item">
          <div>
            <div className="log-title">{item.title || "-"}</div>
            <div className="helper-text">{item.message || "-"}</div>
          </div>
          <div className="helper-text">{item.created_at || "-"}</div>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function UserActivity({ data, loading, error }) {
  const { t } = useLocale();
  return (
    <section className="card profile-card">
      <div className="profile-title">{t("users.activity.title")}</div>
      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.length === 0 ? (
        <div className="empty-state">{t("dashboard.noData")}</div>
      ) : (
        <ul className="log-list">
          {data.map((item) => (
            <li key={item.id} className="log-item">
              <div>
                <div className="log-title">{item.event_type}</div>
                <div className="helper-text">{item.details || "-"}</div>
              </div>
              <div className="helper-text">{formatDate(item.created_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

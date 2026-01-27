"use client";

import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const parseJson = (value) => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export default function UserAudit({ data, loading, error, embedded = false }) {
  const { t } = useLocale();
  return (
    <section className={`card profile-card${embedded ? " embedded-card" : ""}`}>
      <div className="profile-title">{t("users.audit.title")}</div>
      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="skeleton-block" />
      ) : data.length === 0 ? (
        <div className="empty-state">{t("dashboard.noData")}</div>
      ) : (
        <div className="audit-list">
          {data.map((item) => (
            <div key={item.id} className="audit-card">
              <div className="audit-header">
                <div>
                  <div className="audit-title">{item.action}</div>
                  <div className="helper-text">
                    {t("audit.actor")}: {item.actor}
                  </div>
                </div>
                <div className="helper-text">{formatDate(item.created_at)}</div>
              </div>
              <div className="audit-body">
                <div>
                  <div className="helper-text">{t("audit.before")}</div>
                  <pre className="audit-code">
                    {JSON.stringify(parseJson(item.before_json), null, 2) || "-"}
                  </pre>
                </div>
                <div>
                  <div className="helper-text">{t("audit.after")}</div>
                  <pre className="audit-code">
                    {JSON.stringify(parseJson(item.after_json), null, 2) || "-"}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

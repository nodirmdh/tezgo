"use client";

import { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

export default function OrderProblemFlags({ orderId }) {
  const { t } = useLocale();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadFlags = async () => {
    setLoading(true);
    const result = await apiJson(`/admin/problem-flags?order_id=${orderId}&resolved=false`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setLoading(false);
      return;
    }
    setFlags(result.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadFlags();
  }, [orderId]);

  const handleResolve = async (flagId) => {
    const result = await apiJson(`/admin/problem-flags/${flagId}/resolve`, {
      method: "PATCH"
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("flags.resolved") });
    loadFlags();
  };

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-title">{t("flags.title")}</div>
      {loading ? (
        <div className="skeleton-block" />
      ) : flags.length === 0 ? (
        <div className="empty-state">{t("flags.empty")}</div>
      ) : (
        <ul className="log-list">
          {flags.map((flag) => (
            <li key={flag.id} className="log-item">
              <div>
                <div className="log-title">{t(`flags.types.${flag.type}`, { defaultValue: flag.type })}</div>
                <div className="helper-text">{flag.description}</div>
              </div>
              <div className="table-actions">
                <span className={`badge severity ${flag.severity}`}>
                  {t(`orders.severity.${flag.severity}`, { defaultValue: flag.severity })}
                </span>
                <button
                  className="action-link"
                  type="button"
                  onClick={() => handleResolve(flag.id)}
                >
                  {t("flags.resolve")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

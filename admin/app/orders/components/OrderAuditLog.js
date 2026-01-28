"use client";

import { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function OrderAuditLog({ orderId }) {
  const { t } = useLocale();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadAudit = async () => {
    setLoading(true);
    const result = await apiJson(`/admin/orders/${orderId}/audit`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setLoading(false);
      return;
    }
    setItems(result.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAudit();
  }, [orderId]);

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-title">{t("audit.title")}</div>
      {loading ? (
        <div className="skeleton-block" />
      ) : items.length === 0 ? (
        <div className="empty-state">{t("audit.empty")}</div>
      ) : (
        <ul className="log-list">
          {items.map((item) => (
            <li key={item.id} className="log-item">
              <div>
                <div className="log-title">{item.action}</div>
                <div className="helper-text">
                  {item.actor_role || "-"}  /  {item.actor_user_id || "-"}
                </div>
                {item.request_id ? (
                  <div className="helper-text">request_id: {item.request_id}</div>
                ) : null}
              </div>
              <div className="helper-text">{formatDate(item.created_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


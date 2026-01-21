"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

export default function DashboardClient() {
  const { locale, t } = useLocale();
  const [summary, setSummary] = useState(null);
  const [problemOrders, setProblemOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    const result = await apiJson("/api/dashboard/summary");
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setLoading(false);
      return;
    }
    setSummary(result.data);
    setProblemOrders(result.data.problem_orders || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {loading ? (
        <div className="form-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : (
        <>
          <section className="cards">
            {(summary?.cards || []).map((card) => (
              <div key={card.titleKey || card.title} className="card">
                <div style={{ color: "#64748B", fontSize: "13px" }}>
                  {card.titleKey ? t(card.titleKey) : card.title}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
                  {card.value}
                </div>
              </div>
            ))}
          </section>

          <section className="card profile-card">
            <div className="profile-title">{t("dashboard.problemOrders")}</div>
            {problemOrders.length === 0 ? (
              <div className="empty-state">{t("dashboard.noData")}</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("dashboard.table2.orderId")}</th>
                    <th>{t("dashboard.table2.status")}</th>
                    <th>{t("dashboard.table2.outlet")}</th>
                    <th>{t("dashboard.table2.created")}</th>
                    <th>{t("dashboard.table2.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {problemOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>
                        <span className="badge">
                          {translateStatus(locale, order.status)}
                        </span>
                      </td>
                      <td>{order.outlet_name || "-"}</td>
                      <td>{order.created_at || "-"}</td>
                      <td>
                        <Link className="action-link" href={`/orders/${order.id}`}>
                          {t("dashboard.table2.view")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card profile-card">
            <div className="profile-title">{t("dashboard.quickLinks")}</div>
            <div className="table-actions">
              <Link className="action-link" href="/orders">
                {t("nav.orders")}
              </Link>
              <Link className="action-link" href="/users">
                {t("nav.users")}
              </Link>
              <Link className="action-link" href="/clients">
                {t("nav.clients")}
              </Link>
              <Link className="action-link" href="/couriers">
                {t("nav.couriers")}
              </Link>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

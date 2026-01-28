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
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [assignCourierId, setAssignCourierId] = useState("");
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSource, setCancelSource] = useState("support");
  const [cancelPenalty, setCancelPenalty] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    const result = await apiJson("/admin/dashboard/summary");
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setLoading(false);
      return;
    }
    setSummary(result.data);
    setProblemOrders(result.data.problem_orders || []);
    const leaderboard = await apiJson("/admin/couriers/leaderboard");
    if (leaderboard.ok) {
      setLeaders(leaderboard.data.items || []);
    }
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
            <div className="card">
              <div style={{ color: "#64748B", fontSize: "13px" }}>{t("dashboard.activeOrders")}</div>
              <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
                {Object.values(summary?.status_counts || {}).reduce((sum, value) => sum + Number(value || 0), 0)}
              </div>
            </div>
            <div className="card">
              <div style={{ color: "#64748B", fontSize: "13px" }}>{t("dashboard.noCourier")}</div>
              <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
                {summary?.no_courier_count || 0}
              </div>
            </div>
            <div className="card">
              <div style={{ color: "#64748B", fontSize: "13px" }}>{t("dashboard.ordersToday")}</div>
              <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
                {summary?.today?.orders || 0}
              </div>
            </div>
            <div className="card">
              <div style={{ color: "#64748B", fontSize: "13px" }}>{t("dashboard.cancelledToday")}</div>
              <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
                {summary?.today?.cancelled || 0}
              </div>
            </div>
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
                        <div className="table-actions">
                          <Link className="action-link" href={`/orders/${order.id}`}>
                            {t("dashboard.table2.view")}
                          </Link>
                          <button
                            className="action-link"
                            type="button"
                            onClick={() => {
                              setAssigningOrder(order);
                              setAssignCourierId("");
                            }}
                          >
                            {t("orders.actions.assignCourier")}
                          </button>
                          <button
                            className="action-link danger"
                            type="button"
                            onClick={() => {
                              setCancelOrder(order);
                              setCancelReason("");
                              setCancelPenalty("");
                            }}
                          >
                            {t("orders.actions.cancel")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card profile-card">
            <div className="profile-title">{t("dashboard.topCouriers")}</div>
            {leaders.length === 0 ? (
              <div className="empty-state">{t("dashboard.noData")}</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("couriers.table.courier")}</th>
                    <th>{t("dashboard.delivered")}</th>
                    <th>{t("dashboard.avgDelivery")}</th>
                    <th>{t("dashboard.penalties")}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.slice(0, 10).map((courier) => (
                    <tr key={courier.courier_user_id}>
                      <td>{courier.username || courier.courier_user_id}</td>
                      <td>{courier.delivered_count}</td>
                      <td>{courier.avg_delivery_time ? `${courier.avg_delivery_time}m` : "-"}</td>
                      <td>{courier.penalty_sum || 0}</td>
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

          {assigningOrder ? (
            <div className="modal-overlay" role="dialog" aria-modal="true">
              <div className="modal">
                <div className="modal-header">
                  <div className="modal-title">{t("orders.actions.assignCourier")}</div>
                <button
                  className="modal-close"
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                >
                  x
                </button>
                </div>
                <div className="form-grid">
                  <div className="auth-field">
                    <label htmlFor="dashAssignCourier">{t("orders.support.courierId")}</label>
                    <input
                      id="dashAssignCourier"
                      className="input"
                      value={assignCourierId}
                      onChange={(event) => setAssignCourierId(event.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={async () => {
                      const result = await apiJson(
                        `/admin/orders/${assigningOrder.id}/assign-courier`,
                        {
                          method: "POST",
                          body: JSON.stringify({ courierUserId: Number(assignCourierId) })
                        }
                      );
                      if (!result.ok) {
                        setToast({ type: "error", message: t(result.error) });
                        return;
                      }
                      setToast({ type: "success", message: t("orders.support.reassigned") });
                      setAssigningOrder(null);
                      fetchDashboard();
                    }}
                  >
                    {t("orders.actions.assignCourier")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {cancelOrder ? (
            <div className="modal-overlay" role="dialog" aria-modal="true">
              <div className="modal">
                <div className="modal-header">
                  <div className="modal-title">{t("orders.actions.cancel")}</div>
                <button
                  className="modal-close"
                  type="button"
                  onClick={() => setCancelOrder(null)}
                >
                  x
                </button>
                </div>
                <div className="form-grid">
                  <div className="auth-field">
                    <label htmlFor="dashCancelReason">{t("orders.support.cancelReason")}</label>
                    <input
                      id="dashCancelReason"
                      className="input"
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                    />
                  </div>
                  <div className="form-row two">
                    <div className="auth-field">
                      <label htmlFor="dashCancelSource">{t("orders.support.cancelSource")}</label>
                      <select
                        id="dashCancelSource"
                        className="select"
                        value={cancelSource}
                        onChange={(event) => setCancelSource(event.target.value)}
                      >
                        <option value="support">{t("orders.support.cancelSourceSupport")}</option>
                        <option value="client">{t("orders.support.cancelSourceClient")}</option>
                        <option value="partner">{t("orders.support.cancelSourcePartner")}</option>
                        <option value="system">{t("orders.support.cancelSourceSystem")}</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label htmlFor="dashCancelPenalty">{t("orders.support.penaltyAmount")}</label>
                      <input
                        id="dashCancelPenalty"
                        className="input"
                        type="number"
                        min="0"
                        value={cancelPenalty}
                        onChange={(event) => setCancelPenalty(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    className="button danger"
                    type="button"
                    onClick={async () => {
                      if (!cancelReason.trim()) {
                        setToast({
                          type: "error",
                          message: t("orders.support.cancelReasonRequired")
                        });
                        return;
                      }
                      const result = await apiJson(
                        `/admin/orders/${cancelOrder.id}/cancel`,
                        {
                          method: "POST",
                          body: JSON.stringify({
                            reason: cancelReason.trim(),
                            source: cancelSource,
                            penalty_amount: cancelPenalty ? Number(cancelPenalty) : 0
                          })
                        }
                      );
                      if (!result.ok) {
                        setToast({ type: "error", message: t(result.error) });
                        return;
                      }
                      setToast({ type: "success", message: t("orders.support.cancelled") });
                      setCancelOrder(null);
                      fetchDashboard();
                    }}
                  >
                    {t("orders.actions.cancel")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}


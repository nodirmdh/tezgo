"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";

export default function DashboardClient() {
  const [summary, setSummary] = useState(null);
  const [problemOrders, setProblemOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    const result = await apiJson("/api/dashboard/summary");
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
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
              <div key={card.title} className="card">
                <div style={{ color: "#64748B", fontSize: "13px" }}>
                  {card.title}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
                  {card.value}
                </div>
              </div>
            ))}
          </section>

          <section className="card profile-card">
            <div className="profile-title">Problem orders</div>
            {problemOrders.length === 0 ? (
              <div className="empty-state">No data yet</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Status</th>
                    <th>Outlet</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {problemOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>
                        <span className="badge">{order.status}</span>
                      </td>
                      <td>{order.outlet_name || "-"}</td>
                      <td>{order.created_at || "-"}</td>
                      <td>
                        <Link className="action-link" href={`/orders/${order.id}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card profile-card">
            <div className="profile-title">Quick links</div>
            <div className="table-actions">
              <Link className="action-link" href="/orders">
                Orders
              </Link>
              <Link className="action-link" href="/users">
                Users
              </Link>
              <Link className="action-link" href="/clients">
                Clients
              </Link>
              <Link className="action-link" href="/couriers">
                Couriers
              </Link>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
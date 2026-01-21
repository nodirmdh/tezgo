"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";

const rangeOptions = [
  { value: "today", label: "Today" },
  { value: "last24h", label: "Last 24h" },
  { value: "custom", label: "Custom" }
];

const problemFilters = [
  { value: "", label: "All" },
  { value: "courier_search", label: "Courier search delayed" },
  { value: "cooking", label: "Cooking delayed" },
  { value: "waiting_pickup", label: "Waiting pickup" },
  { value: "delivery", label: "Delivery delayed" }
];

const formatMinutes = (value) => (value === null || value === undefined ? "—" : `${value} min`);

const formatPercent = (value) => (value === null || value === undefined ? "—" : `${value}%`);

const formatSla = (sla) => {
  if (!sla) return "—";
  return `CS ${sla.courierSearch ?? "—"} · Cook ${sla.cooking ?? "—"} · Wait ${sla.waitingPickup ?? "—"} · Del ${sla.delivery ?? "—"}`;
};

const getSeverityClass = (severity) => {
  if (severity === "P1") return "high";
  if (severity === "P2") return "medium";
  return "low";
};

export default function DashboardClient() {
  const [kpis, setKpis] = useState(null);
  const [problemOrders, setProblemOrders] = useState({ items: [], pageInfo: { page: 1, limit: 10, total: 0 } });
  const [topOutlets, setTopOutlets] = useState([]);
  const [topCouriers, setTopCouriers] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [range, setRange] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [outletId, setOutletId] = useState("");
  const [problematicOnly, setProblematicOnly] = useState(true);
  const [problemKey, setProblemKey] = useState("");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [role, setRole] = useState("support");

  const canAutoRefresh = useMemo(
    () => ["admin", "support"].includes(normalizeRole(role)),
    [role]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("adminAuth");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setRole(parsed.role || "support");
  }, []);

  useEffect(() => {
    const now = new Date();
    if (!customFrom) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      setCustomFrom(start.toISOString().slice(0, 16));
    }
    if (!customTo) {
      setCustomTo(now.toISOString().slice(0, 16));
    }
  }, [customFrom, customTo]);

  const buildDateRange = () => {
    const now = new Date();
    if (range === "last24h") {
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    if (range === "custom") {
      const from = customFrom ? new Date(customFrom).toISOString() : null;
      const to = customTo ? new Date(customTo).toISOString() : null;
      return { dateFrom: from, dateTo: to };
    }
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
  };

  const fetchOutlets = async () => {
    const result = await apiJson("/api/outlets");
    if (result.ok) {
      setOutlets(result.data || []);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    const { dateFrom, dateTo } = buildDateRange();
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      problematicOnly: String(problematicOnly)
    });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (outletId) params.set("outletId", outletId);
    if (problemKey) params.set("problemKey", problemKey);

    const result = await apiJson(`/api/dashboard/ops?${params.toString()}`);
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      setLoading(false);
      return;
    }
    setKpis(result.data.kpis);
    setProblemOrders(result.data.problemOrders);
    setTopOutlets(result.data.topOutlets || []);
    setTopCouriers(result.data.topCouriers || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [range, customFrom, customTo, outletId, problematicOnly, problemKey, page]);

  useEffect(() => {
    if (!autoRefresh || !canAutoRefresh) return undefined;
    const interval = setInterval(() => {
      fetchDashboard();
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, canAutoRefresh, range, customFrom, customTo, outletId, problematicOnly, problemKey, page]);

  const totalPages = Math.max(1, Math.ceil((problemOrders.pageInfo.total || 0) / 10));

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <section className="cards">
        <div className="card">
          <div className="card-title">Orders today</div>
          <div className="card-value">{kpis ? kpis.ordersCount : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Active problems</div>
          <div className="card-value">{kpis ? kpis.activeProblemsCount : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Avg delivery time</div>
          <div className="card-value">{kpis ? formatMinutes(kpis.avgDeliveryMin) : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Avg courier search</div>
          <div className="card-value">{kpis ? formatMinutes(kpis.avgCourierSearchMin) : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Cancel rate</div>
          <div className="card-value">{kpis ? formatPercent(kpis.cancelRate) : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Delayed orders</div>
          <div className="card-value">{kpis ? kpis.delayedOrdersCount : "—"}</div>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">Filters</div>
        <div className="toolbar">
          <div className="toolbar-actions">
            <select
              className="select"
              value={range}
              onChange={(event) => {
                setRange(event.target.value);
                setPage(1);
              }}
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {range === "custom" ? (
              <>
                <input
                  className="input"
                  type="datetime-local"
                  value={customFrom}
                  onChange={(event) => {
                    setCustomFrom(event.target.value);
                    setPage(1);
                  }}
                />
                <input
                  className="input"
                  type="datetime-local"
                  value={customTo}
                  onChange={(event) => {
                    setCustomTo(event.target.value);
                    setPage(1);
                  }}
                />
              </>
            ) : null}
            <select
              className="select"
              value={outletId}
              onChange={(event) => {
                setOutletId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All outlets</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
            <label className="checkbox" htmlFor="problematicOnly">
              <input
                id="problematicOnly"
                type="checkbox"
                checked={problematicOnly}
                onChange={(event) => {
                  setProblematicOnly(event.target.checked);
                  setPage(1);
                }}
              />
              Problematic only
            </label>
          </div>
          <div className="toolbar-actions">
            <button className="button ghost" type="button" onClick={fetchDashboard}>
              Refresh
            </button>
            {canAutoRefresh ? (
              <label className="checkbox" htmlFor="autoRefresh">
                <input
                  id="autoRefresh"
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(event) => setAutoRefresh(event.target.checked)}
                />
                Auto-refresh (60s)
              </label>
            ) : null}
          </div>
        </div>
        <div className="filter-chips">
          {problemFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`filter-chip ${problemKey === filter.value ? "active" : ""}`}
              onClick={() => {
                setProblemKey(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">Problem orders</div>
        {loading ? (
          <div className="skeleton-block" />
        ) : problemOrders.items.length === 0 ? (
          <div className="empty-state">No problem orders</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Order</th>
                <th>Status</th>
                <th>Problem</th>
                <th>SLA summary</th>
                <th>Outlet</th>
                <th>Courier</th>
                <th>Client</th>
                <th>Created / Age</th>
              </tr>
            </thead>
            <tbody>
              {problemOrders.items.map((order) => (
                <tr key={order.orderId} className={order.severity === "P1" ? "row-highlight" : ""}>
                  <td>
                    <span className={`badge severity ${getSeverityClass(order.severity)}`}>
                      {order.severity}
                    </span>
                  </td>
                  <td>
                    <Link className="action-link" href={`/orders/${order.orderId}`}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td>
                    <span className="badge">{order.status}</span>
                  </td>
                  <td>{order.primaryProblemTitle || "—"}</td>
                  <td className="mono">{formatSla(order.slaSummary)}</td>
                  <td>
                    {order.outlet ? (
                      <Link className="action-link" href={`/outlets/${order.outlet.id}`}>
                        {order.outlet.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {order.courier ? (
                      <Link className="action-link" href={`/couriers/${order.courier.id}`}>
                        {order.courier.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Link className="action-link" href={`/clients/${order.client.id}`}>
                      {order.client.name}
                    </Link>
                    <div className="helper-text">{order.client.phone}</div>
                  </td>
                  <td>
                    <div>{order.createdAt || "—"}</div>
                    <div className="helper-text">
                      {order.ageMinutes !== null ? `${order.ageMinutes} min ago` : "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="pagination">
          <button
            className="button"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            Back
          </button>
          <div className="helper-text">
            Page {page} of {totalPages}
          </div>
          <button
            className="button"
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
          >
            Next
          </button>
        </div>
      </section>

      <section className="cards">
        <section className="card profile-card">
          <div className="profile-title">Top outlets by delays</div>
          {loading ? (
            <div className="skeleton-block" />
          ) : topOutlets.length === 0 ? (
            <div className="empty-state">No outlet analytics yet</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Outlet</th>
                  <th>Problem orders</th>
                  <th>Avg cooking</th>
                  <th>Avg ready → pickup</th>
                  <th>Cancels</th>
                </tr>
              </thead>
              <tbody>
                {topOutlets.map((outlet) => (
                  <tr key={outlet.outletId}>
                    <td>
                      <Link className="action-link" href={`/outlets/${outlet.outletId}`}>
                        {outlet.outletName}
                      </Link>
                    </td>
                    <td>{outlet.problemOrdersCount}</td>
                    <td>{formatMinutes(outlet.avgCookingMin)}</td>
                    <td>{formatMinutes(outlet.avgReadyPickupMin)}</td>
                    <td>{outlet.cancelsCount ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card profile-card">
          <div className="profile-title">Top couriers by delays</div>
          {loading ? (
            <div className="skeleton-block" />
          ) : !topCouriers ? (
            <div className="empty-state">Courier analytics not available yet</div>
          ) : topCouriers.length === 0 ? (
            <div className="empty-state">No courier analytics yet</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Problem orders</th>
                  <th>Avg pickup delay</th>
                  <th>Avg delivery</th>
                </tr>
              </thead>
              <tbody>
                {topCouriers.map((courier) => (
                  <tr key={courier.courierId}>
                    <td>
                      <Link className="action-link" href={`/couriers/${courier.courierId}`}>
                        {courier.courierName}
                      </Link>
                    </td>
                    <td>{courier.problemOrdersCount}</td>
                    <td>{formatMinutes(courier.avgPickupDelayMin)}</td>
                    <td>{formatMinutes(courier.avgDeliveryMin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>
    </section>
  );
}

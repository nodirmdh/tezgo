"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";
import Toast from "../../components/Toast";
import CourierTabs from "./CourierTabs";
import CourierOverview from "./CourierOverview";
import CourierOrders from "./CourierOrders";
import CourierFinance from "./CourierFinance";
import CourierNotes from "./CourierNotes";

const emptyOrders = { items: [], page: 1, limit: 10, total: 0 };

export default function CourierProfileClient({ courierId, initialCourier }) {
  const [courier, setCourier] = useState(initialCourier);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [role, setRole] = useState("support");
  const [authorTgId, setAuthorTgId] = useState(null);
  const [tabState, setTabState] = useState({
    orders: { data: emptyOrders, loading: false, error: null },
    finance: { data: null, loading: false, error: null },
    notes: { data: [], loading: false, error: null }
  });
  const [orderFilters, setOrderFilters] = useState({
    q: "",
    status: "",
    page: 1,
    limit: 10
  });

  useEffect(() => {
    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored);
    setRole(normalizeRole(parsed.role));
    setAuthorTgId(parsed.tgId || null);
  }, []);

  const reloadCourier = async () => {
    const result = await apiJson(`/api/couriers/${courierId}`);
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setCourier(result.data);
  };

  const loadOrders = async (filters) => {
    setTabState((prev) => ({
      ...prev,
      orders: { ...prev.orders, loading: true, error: null }
    }));
    const query = new URLSearchParams({
      q: filters.q,
      status: filters.status,
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/couriers/${courierId}/orders?${query}`);
    if (!result.ok) {
      setTabState((prev) => ({
        ...prev,
        orders: { ...prev.orders, loading: false, error: result.error }
      }));
      return;
    }
    setTabState((prev) => ({
      ...prev,
      orders: { data: result.data, loading: false, error: null }
    }));
  };

  const loadFinance = async () => {
    setTabState((prev) => ({
      ...prev,
      finance: { ...prev.finance, loading: true, error: null }
    }));
    const result = await apiJson(`/api/users/${courierId}/finance`);
    if (!result.ok) {
      setTabState((prev) => ({
        ...prev,
        finance: { ...prev.finance, loading: false, error: result.error }
      }));
      return;
    }
    setTabState((prev) => ({
      ...prev,
      finance: { data: result.data, loading: false, error: null }
    }));
  };

  const loadNotes = async () => {
    setTabState((prev) => ({
      ...prev,
      notes: { ...prev.notes, loading: true, error: null }
    }));
    const result = await apiJson(`/api/couriers/${courierId}/notes`);
    if (!result.ok) {
      setTabState((prev) => ({
        ...prev,
        notes: { ...prev.notes, loading: false, error: result.error }
      }));
      return;
    }
    setTabState((prev) => ({
      ...prev,
      notes: { data: result.data, loading: false, error: null }
    }));
  };

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders(orderFilters);
    }
    if (activeTab === "finance") {
      loadFinance();
    }
    if (activeTab === "notes") {
      loadNotes();
    }
  }, [activeTab, orderFilters]);

  const handleBlockToggle = async () => {
    const nextStatus = courier.user_status === "blocked" ? "active" : "blocked";
    const result = await apiJson(`/api/couriers/${courierId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Статус обновлён" });
    reloadCourier();
  };

  const handleAddNote = async (text) => {
    const result = await apiJson(`/api/couriers/${courierId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Заметка добавлена" });
    loadNotes();
  };

  const handleDeleteNote = async (noteId) => {
    const result = await apiJson(`/api/couriers/${courierId}/notes/${noteId}`, {
      method: "DELETE"
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Заметка удалена" });
    loadNotes();
  };

  const financeData = useMemo(() => {
    if (!tabState.finance.data) {
      return { summary: [], transactions: [] };
    }
    return tabState.finance.data;
  }, [tabState.finance.data]);

  return (
    <div className="profile-wrapper">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-header">
        <div>
          <div className="profile-eyebrow">Courier profile</div>
          <h1>{courier.username || courier.tg_id || `Courier #${courier.id}`}</h1>
          <div className="helper-text">ID: {courier.id}</div>
        </div>
        <div className="profile-role">
          <span className="badge">
            {courier.is_active ? "online" : "offline"}
          </span>
          <span className="badge">{courier.user_status || "active"}</span>
        </div>
      </div>

      <CourierTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <CourierOverview
          courier={courier}
          role={role}
          onBlockToggle={handleBlockToggle}
        />
      ) : null}
      {activeTab === "orders" ? (
        <CourierOrders
          data={tabState.orders.data}
          filters={orderFilters}
          loading={tabState.orders.loading}
          error={tabState.orders.error}
          onFilterChange={setOrderFilters}
          onPageChange={(page) => setOrderFilters({ ...orderFilters, page })}
        />
      ) : null}
      {activeTab === "finance" ? (
        <CourierFinance
          data={financeData}
          loading={tabState.finance.loading}
          error={tabState.finance.error}
        />
      ) : null}
      {activeTab === "notes" ? (
        <CourierNotes
          notes={tabState.notes.data}
          role={role}
          authorTgId={authorTgId}
          loading={tabState.notes.loading}
          error={tabState.notes.error}
          onAdd={handleAddNote}
          onDelete={handleDeleteNote}
        />
      ) : null}
    </div>
  );
}
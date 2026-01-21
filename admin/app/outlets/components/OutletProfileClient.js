"use client";

import { useEffect, useState } from "react";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";
import Toast from "../../components/Toast";
import OutletTabs from "./OutletTabs";
import OutletOverview from "./OutletOverview";
import OutletOrders from "./OutletOrders";
import OutletNotes from "./OutletNotes";
import OutletMenuProducts from "./OutletMenuProducts";
import OutletCampaigns from "./OutletCampaigns";
import { useLocale } from "../../components/LocaleProvider";

const emptyOrders = { items: [], page: 1, limit: 10, total: 0 };

export default function OutletProfileClient({ outletId, initialOutlet }) {
  const { t } = useLocale();
  const [outlet, setOutlet] = useState(initialOutlet);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [authorTgId, setAuthorTgId] = useState(null);
  const [role, setRole] = useState("support");
  const [tabState, setTabState] = useState({
    orders: { data: emptyOrders, loading: false, error: null },
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

  const reloadOutlet = async () => {
    const result = await apiJson(`/api/outlets/${outletId}`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setOutlet(result.data);
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
    const result = await apiJson(`/api/outlets/${outletId}/orders?${query}`);
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

  const loadNotes = async () => {
    setTabState((prev) => ({
      ...prev,
      notes: { ...prev.notes, loading: true, error: null }
    }));
    const result = await apiJson(`/api/outlets/${outletId}/notes`);
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
    if (activeTab === "notes") {
      loadNotes();
    }
  }, [activeTab, orderFilters]);

  const handleStatusToggle = async (status, reason = null) => {
    const result = await apiJson(`/api/outlets/${outletId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, status_reason: reason })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("outlets.toasts.statusUpdated") });
    reloadOutlet();
  };

  const handleAddNote = async (text) => {
    const result = await apiJson(`/api/outlets/${outletId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("outlets.toasts.noteAdded") });
    loadNotes();
  };

  const handleDeleteNote = async (noteId) => {
    const result = await apiJson(`/api/outlets/${outletId}/notes/${noteId}`, {
      method: "DELETE"
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("outlets.toasts.noteDeleted") });
    loadNotes();
  };

  return (
    <div className="profile-wrapper">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-header">
        <div>
          <div className="profile-eyebrow">{t("outlets.profile.eyebrow")}</div>
          <h1>{outlet.name}</h1>
          <div className="helper-text">
            {t("outlets.profile.idLabel")}: {outlet.id}
          </div>
        </div>
        <div className="profile-role">
          <span className="badge">
            {t(`outlets.status.${outlet.status || "open"}`, {
              defaultValue: outlet.status || "open"
            })}
          </span>
        </div>
      </div>

      <OutletTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <OutletOverview
          outlet={outlet}
          role={role}
          onStatusChange={handleStatusToggle}
        />
      ) : null}
      {activeTab === "orders" ? (
        <OutletOrders
          data={tabState.orders.data}
          filters={orderFilters}
          loading={tabState.orders.loading}
          error={tabState.orders.error}
          onFilterChange={setOrderFilters}
          onPageChange={(page) => setOrderFilters({ ...orderFilters, page })}
        />
      ) : null}
      {activeTab === "notes" ? (
        <OutletNotes
          notes={tabState.notes.data}
          role={role}
          authorTgId={authorTgId}
          loading={tabState.notes.loading}
          error={tabState.notes.error}
          onAdd={handleAddNote}
          onDelete={handleDeleteNote}
        />
      ) : null}
      {activeTab === "menu" ? (
        <OutletMenuProducts outletId={outletId} role={role} />
      ) : null}
      {activeTab === "campaigns" ? (
        <OutletCampaigns outletId={outletId} role={role} />
      ) : null}
    </div>
  );
}

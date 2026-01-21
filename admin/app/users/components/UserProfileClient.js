"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../../lib/api/client";
import Toast from "../../components/Toast";
import UserTabs from "./UserTabs";
import UserOverview from "./UserOverview";
import UserOrders from "./UserOrders";
import UserFinance from "./UserFinance";
import UserActivity from "./UserActivity";
import UserAudit from "./UserAudit";
import { translateRole, translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const defaultOrders = { items: [], page: 1, page_size: 10, total: 0 };

export default function UserProfileClient({ userId, initialUser }) {
  const { locale, t } = useLocale();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(initialUser);
  const [role, setRole] = useState("Support");
  const [toast, setToast] = useState(null);
  const [tabState, setTabState] = useState({
    orders: { data: defaultOrders, loading: false, error: null },
    finance: { data: null, loading: false, error: null },
    activity: { data: [], loading: false, error: null },
    audit: { data: [], loading: false, error: null }
  });
  const [orderFilters, setOrderFilters] = useState({
    q: "",
    status: "",
    page: 1,
    page_size: 10
  });

  useEffect(() => {
    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored);
    setRole(parsed.role || "Support");
  }, []);

  const loadUser = async () => {
    const result = await apiJson(`/api/users/${userId}`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setUser(result.data);
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
      page_size: String(filters.page_size)
    }).toString();
    const result = await apiJson(`/api/users/${userId}/orders?${query}`);
    if (!result.ok) {
      setTabState((prev) => ({
        ...prev,
        orders: {
          ...prev.orders,
          loading: false,
          error: result.error
        }
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
    const result = await apiJson(`/api/users/${userId}/finance`);
    if (!result.ok) {
      setTabState((prev) => ({
        ...prev,
        finance: {
          ...prev.finance,
          loading: false,
          error: result.error
        }
      }));
      return;
    }
    setTabState((prev) => ({
      ...prev,
      finance: { data: result.data, loading: false, error: null }
    }));
  };

  const loadActivity = async () => {
    setTabState((prev) => ({
      ...prev,
      activity: { ...prev.activity, loading: true, error: null }
    }));
    const result = await apiJson(`/api/users/${userId}/activity`);
    if (!result.ok) {
      setTabState((prev) => ({
        ...prev,
        activity: {
          ...prev.activity,
          loading: false,
          error: result.error
        }
      }));
      return;
    }
    setTabState((prev) => ({
      ...prev,
      activity: { data: result.data, loading: false, error: null }
    }));
  };

  const loadAudit = async () => {
    setTabState((prev) => ({
      ...prev,
      audit: { ...prev.audit, loading: true, error: null }
    }));
    const result = await apiJson(`/api/users/${userId}/audit`);
    if (!result.ok) {
      setTabState((prev) => ({
        ...prev,
        audit: {
          ...prev.audit,
          loading: false,
          error: result.error
        }
      }));
      return;
    }
    setTabState((prev) => ({
      ...prev,
      audit: { data: result.data, loading: false, error: null }
    }));
  };

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders(orderFilters);
    }
    if (activeTab === "finance") {
      loadFinance();
    }
    if (activeTab === "activity") {
      loadActivity();
    }
    if (activeTab === "audit") {
      loadAudit();
    }
  }, [activeTab, orderFilters]);

  const handleUpdateUser = async (formData) => {
    const payload = {
      username: formData.get("username") || null,
      role: formData.get("role") || null,
      status: formData.get("status") || null
    };
    const result = await apiJson(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setUser(result.data);
    setToast({ type: "success", message: t("users.toasts.updated") });
  };

  const handleDeleteUser = async () => {
    const result = await apiJson(`/api/users/${userId}`, {
      method: "DELETE"
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("users.toasts.deleted") });
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
          <div className="profile-eyebrow">{t("users.profile.eyebrow")}</div>
          <h1>{user.username || user.tg_id}</h1>
          <div className="helper-text">
            {t("users.profile.idLabel")}: {user.id}
          </div>
        </div>
        <div className="profile-role">
          <span className="badge">{translateRole(locale, user.role)}</span>
          <span className="badge">{translateStatus(locale, user.status)}</span>
        </div>
      </div>
      <UserTabs active={activeTab} onChange={setActiveTab} />
      {activeTab === "overview" ? (
        <UserOverview
          user={user}
          role={role}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
          onToast={(message, type) => setToast({ message, type })}
        />
      ) : null}
      {activeTab === "orders" ? (
        <UserOrders
          data={tabState.orders.data}
          filters={orderFilters}
          loading={tabState.orders.loading}
          error={tabState.orders.error}
          onFilterChange={(filters) => setOrderFilters(filters)}
          onPageChange={(page) => setOrderFilters({ ...orderFilters, page })}
        />
      ) : null}
      {activeTab === "finance" ? (
        <UserFinance
          data={financeData}
          loading={tabState.finance.loading}
          error={tabState.finance.error}
        />
      ) : null}
      {activeTab === "activity" ? (
        <UserActivity
          data={tabState.activity.data}
          loading={tabState.activity.loading}
          error={tabState.activity.error}
        />
      ) : null}
      {activeTab === "audit" ? (
        <UserAudit
          data={tabState.audit.data}
          loading={tabState.audit.loading}
          error={tabState.audit.error}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson } from "../../../lib/api/client";
import Toast from "../../components/Toast";
import UserOverview from "./UserOverview";
import UserOrders from "./UserOrders";
import UserFinance from "./UserFinance";
import UserActivity from "./UserActivity";
import UserAudit from "./UserAudit";
import { translateRole, translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const defaultOrders = { items: [], page: 1, page_size: 10, total: 0 };
const SECTION_STORAGE_KEY = "admin.userProfileSection";
const allowedSections = new Set([
  "overview",
  "orders",
  "finance",
  "activity",
  "audit"
]);

export default function UserProfileClient({ userId, initialUser }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(initialUser);
  const [role, setRole] = useState("Support");
  const [toast, setToast] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
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

  useEffect(() => {
    const fromQuery = searchParams?.get("section");
    if (fromQuery && allowedSections.has(fromQuery)) {
      setActiveSection(fromQuery);
      localStorage.setItem(SECTION_STORAGE_KEY, fromQuery);
      return;
    }
    const storedSection = localStorage.getItem(SECTION_STORAGE_KEY);
    if (storedSection && allowedSections.has(storedSection)) {
      setActiveSection(storedSection);
    }
  }, [searchParams]);

  const updateSection = (next) => {
    const value = allowedSections.has(next) ? next : "overview";
    setActiveSection(value);
    localStorage.setItem(SECTION_STORAGE_KEY, value);
    const params = new URLSearchParams(searchParams?.toString());
    params.set("section", value);
    router.replace(`?${params.toString()}`);
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
    if (activeSection === "orders") {
      loadOrders(orderFilters);
    }
  }, [orderFilters, userId, activeSection]);

  useEffect(() => {
    if (activeSection === "finance") {
      loadFinance();
    }
  }, [userId, activeSection]);

  useEffect(() => {
    if (activeSection === "activity") {
      loadActivity();
    }
  }, [userId, activeSection]);

  useEffect(() => {
    if (activeSection === "audit") {
      loadAudit();
    }
  }, [userId, activeSection]);

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
      <section className="card profile-card user-profile-card">
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

        <div className="profile-section">
          <div className="accordion">
            <details
              open={activeSection === "overview"}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  updateSection("overview");
                }
              }}
            >
              <summary>{t("users.overview.title")}</summary>
              <UserOverview
                embedded
                user={user}
                role={role}
                onUpdate={handleUpdateUser}
                onDelete={handleDeleteUser}
                onToast={(message, type) => setToast({ message, type })}
              />
            </details>

            <details
              open={activeSection === "orders"}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  updateSection("orders");
                }
              }}
            >
              <summary>{t("users.orders.title")}</summary>
              <UserOrders
                embedded
                data={tabState.orders.data}
                filters={orderFilters}
                loading={tabState.orders.loading}
                error={tabState.orders.error}
                onFilterChange={(filters) => setOrderFilters(filters)}
                onPageChange={(page) => setOrderFilters({ ...orderFilters, page })}
              />
            </details>

            <details
              open={activeSection === "finance"}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  updateSection("finance");
                }
              }}
            >
              <summary>{t("users.finance.title")}</summary>
              <UserFinance
                embedded
                data={financeData}
                loading={tabState.finance.loading}
                error={tabState.finance.error}
              />
            </details>

            <details
              open={activeSection === "activity"}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  updateSection("activity");
                }
              }}
            >
              <summary>{t("users.activity.title")}</summary>
              <UserActivity
                embedded
                data={tabState.activity.data}
                loading={tabState.activity.loading}
                error={tabState.activity.error}
              />
            </details>

            <details
              open={activeSection === "audit"}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  updateSection("audit");
                }
              }}
            >
              <summary>{t("users.audit.title")}</summary>
              <UserAudit
                embedded
                data={tabState.audit.data}
                loading={tabState.audit.loading}
                error={tabState.audit.error}
              />
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

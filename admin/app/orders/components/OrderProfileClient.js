"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import OrderTabs from "./OrderTabs";
import OrderOverview from "./OrderOverview";
import OrderTimeline from "./OrderTimeline";
import OrderSupport from "./OrderSupport";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

export default function OrderProfileClient({ orderId, initialOrder }) {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState(initialOrder);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [role, setRole] = useState("support");

  useEffect(() => {
    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored);
    setRole(parsed.role || "support");
  }, []);

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const loadEvents = async () => {
    setLoading(true);
    const result = await apiJson(`/api/orders/${orderId}/events`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setEvents(result.data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "timeline") {
      loadEvents();
    }
  }, [activeTab]);

  const handleOrderUpdated = (update) => {
    if (!update) {
      return;
    }
    setOrder((current) => ({
      ...current,
      items: update.items ?? current.items,
      subtotal_food: update.subtotal_food ?? current.subtotal_food,
      total_amount: update.total_amount ?? current.total_amount,
      status: update.status ?? current.status,
      cancelled_at: update.cancelled_at ?? current.cancelled_at
    }));
  };

  return (
    <div className="profile-wrapper">
      <Toast message={error ? t(error) : null} type="error" onClose={() => setError(null)} />
      <div className="profile-header">
        <div>
          <div className="profile-eyebrow">{t("orders.profile.eyebrow")}</div>
          <h1>{order.order_number}</h1>
          <div className="helper-text">
            {t("orders.profile.idLabel")}: {order.id}
          </div>
        </div>
        <div className="profile-role">
          <span className="badge">{translateStatus(locale, order.status)}</span>
        </div>
      </div>
      <OrderTabs active={activeTab} onChange={setActiveTab} />
      {activeTab === "overview" ? (
        <OrderOverview order={order} role={role} onOrderUpdated={handleOrderUpdated} />
      ) : null}
      {activeTab === "timeline" ? (
        <OrderTimeline
          order={order}
          events={events}
          loading={loading}
          error={error}
          role={role}
          onNoteAdded={loadEvents}
        />
      ) : null}
      {activeTab === "support" ? (
        <OrderSupport orderId={orderId} role={role} />
      ) : null}
    </div>
  );
}

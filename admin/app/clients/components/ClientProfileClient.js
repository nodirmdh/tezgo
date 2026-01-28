"use client";

import { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import ClientOverview from "./ClientOverview";
import ClientOrders from "./ClientOrders";
import ClientNotes from "./ClientNotes";
import ClientAddresses from "./ClientAddresses";
import ClientPromos from "./ClientPromos";
import ClientCrmNote from "./ClientCrmNote";
import ClientSubscriptions from "./ClientSubscriptions";
import ClientDangerZone from "./ClientDangerZone";
import ClientCompensations from "./ClientCompensations";
import ClientMessages from "./ClientMessages";
import ClientAudit from "./ClientAudit";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";
import { getClientAddresses } from "../../../lib/api/clientAddressesApi";
import { getClientPromos } from "../../../lib/api/clientPromosApi";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";
import { useAuth } from "../../components/AuthProvider";

const emptyMetrics = {
  ordersCount: 0,
  totalSpent: 0,
  avgCheck: 0,
  lastOrderAt: null
};

export default function ClientProfileClient({ clientId, initialClient }) {
  const { locale, t } = useLocale();
  const { user: authUser } = useAuth();
  const [client, setClient] = useState(initialClient);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [orders, setOrders] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [orderFilters, setOrderFilters] = useState({
    q: "",
    status: "",
    page: 1,
    limit: 10
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [promos, setPromos] = useState([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [crmNote, setCrmNote] = useState(initialClient?.crm_note || "");
  const [crmSaving, setCrmSaving] = useState(false);
  const [subscriptions, setSubscriptions] = useState(
    initialClient?.subscriptions || null
  );
  const [subscriptionsSaving, setSubscriptionsSaving] = useState(false);
  const [compensations, setCompensations] = useState([]);
  const [compensationsLoading, setCompensationsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [audit, setAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [accordion, setAccordion] = useState({
    orders: false,
    addresses: false,
    rewards: false,
    notes: false,
    messages: false,
    audit: false
  });
  const [rewardsTab, setRewardsTab] = useState("promos");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const role = normalizeRole(authUser?.role);
  const authorTgId = authUser?.tg_id || null;

  const loadMetrics = async () => {
    setMetricsLoading(true);
    const result = await apiJson(`/api/clients/${clientId}/metrics`);
    if (!result.ok) {
      setError(result.error);
      setMetricsLoading(false);
      return;
    }
    setMetrics(result.data);
    setMetricsLoading(false);
  };

  const loadOrders = async (filters) => {
    setOrdersLoading(true);
    const params = new URLSearchParams({
      q: filters.q,
      status: filters.status,
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/clients/${clientId}/orders?${params}`);
    if (!result.ok) {
      setError(result.error);
      setOrdersLoading(false);
      return;
    }
    setOrders(result.data);
    setOrdersLoading(false);
  };

  const loadNotes = async () => {
    setNotesLoading(true);
    const result = await apiJson(`/api/clients/${clientId}/notes`);
    if (!result.ok) {
      setError(result.error);
      setNotesLoading(false);
      return;
    }
    setNotes(result.data);
    setNotesLoading(false);
  };

  const loadAddresses = async () => {
    setAddressesLoading(true);
    const result = await getClientAddresses(clientId);
    if (!result.ok) {
      setError(result.error);
      setAddressesLoading(false);
      return;
    }
    setAddresses(result.data);
    setAddressesLoading(false);
  };

  const loadPromos = async () => {
    setPromosLoading(true);
    const result = await getClientPromos(clientId);
    if (!result.ok) {
      setError(result.error);
      setPromosLoading(false);
      return;
    }
    setPromos(result.data);
    setPromosLoading(false);
  };

  const loadCompensations = async () => {
    setCompensationsLoading(true);
    const result = await apiJson(`/api/clients/${clientId}/compensations`);
    if (!result.ok) {
      setError(result.error);
      setCompensationsLoading(false);
      return;
    }
    setCompensations(result.data);
    setCompensationsLoading(false);
  };

  const loadMessages = async () => {
    setMessagesLoading(true);
    const result = await apiJson(`/api/clients/${clientId}/messages`);
    if (!result.ok) {
      setError(result.error);
      setMessagesLoading(false);
      return;
    }
    setMessages(result.data);
    setMessagesLoading(false);
  };

  const loadAudit = async () => {
    setAuditLoading(true);
    const result = await apiJson(`/api/clients/${clientId}/audit`);
    if (!result.ok) {
      setError(result.error);
      setAuditLoading(false);
      return;
    }
    setAudit(result.data);
    setAuditLoading(false);
  };

  useEffect(() => {
    loadMetrics();
  }, [clientId]);

  useEffect(() => {
    if (accordion.orders) {
      loadOrders(orderFilters);
    }
  }, [accordion.orders, orderFilters]);

  useEffect(() => {
    if (accordion.notes) {
      loadNotes();
    }
  }, [accordion.notes]);

  useEffect(() => {
    if (accordion.addresses) {
      loadAddresses();
    }
  }, [accordion.addresses]);

  useEffect(() => {
    if (!accordion.rewards) {
      return;
    }
    if (rewardsTab === "promos") {
      loadPromos();
      return;
    }
    loadCompensations();
  }, [accordion.rewards, rewardsTab]);

  useEffect(() => {
    if (accordion.messages) {
      loadMessages();
    }
  }, [accordion.messages]);

  useEffect(() => {
    if (accordion.audit) {
      loadAudit();
    }
  }, [accordion.audit]);

  const handleAddNote = async (text) => {
    const result = await apiJson(`/api/clients/${clientId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text, author_tg_id: authorTgId })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setNotes((prev) => [result.data, ...prev]);
    setToast({ type: "success", message: t("clients.toasts.noteAdded") });
  };

  const handleDeleteNote = async (noteId) => {
    const result = await apiJson(`/api/clients/${clientId}/notes/${noteId}`, {
      method: "DELETE"
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    setToast({ type: "success", message: t("clients.toasts.noteDeleted") });
  };

  const handleSaveCrmNote = async (note) => {
    setCrmSaving(true);
    const result = await apiJson(`/api/clients/${clientId}/crm-note`, {
      method: "PATCH",
      body: JSON.stringify({ note })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setCrmSaving(false);
      return;
    }
    setCrmNote(result.data.note);
    setToast({ type: "success", message: t("clients.crm.saved") });
    setCrmSaving(false);
  };

  const handleSaveSubscriptions = async (payload) => {
    setSubscriptionsSaving(true);
    const result = await apiJson(`/api/clients/${clientId}/subscriptions`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setSubscriptionsSaving(false);
      return;
    }
    setSubscriptions(result.data);
    setToast({ type: "success", message: t("clients.subscriptions.saved") });
    setSubscriptionsSaving(false);
  };

  const handleSensitiveAction = async (actionType, reason) => {
    const result = await apiJson(`/api/clients/${clientId}/actions`, {
      method: "POST",
      body: JSON.stringify({ action_type: actionType, reason })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return { ok: false };
    }
    setToast({ type: "success", message: t("clients.danger.actionLogged") });
    return { ok: true };
  };

  const handleBanToggle = async (reason) => {
    const nextStatus = client.status === "active" ? "blocked" : "active";
    const actionType = nextStatus === "blocked" ? "ban_client" : "unban_client";
    const logged = await handleSensitiveAction(actionType, reason);
    if (!logged.ok) {
      return;
    }
    const result = await apiJson(`/api/clients/${clientId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setClient(result.data);
  };

  const handleRevealPhone = async () => {
    const reason = window.prompt(t("clients.actions.revealReason"), "");
    if (reason === null || !reason.trim()) {
      return;
    }
    const logged = await handleSensitiveAction("reveal_phone", reason);
    if (!logged.ok) {
      return;
    }
    setPhoneVisible(true);
  };

  const openAccordion = (key) =>
    setAccordion((prev) => ({ ...prev, [key]: true }));
  const toggleAccordion = (key) =>
    setAccordion((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="profile-wrapper">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-header">
        <div>
          <div className="profile-eyebrow">{t("clients.profile.eyebrow")}</div>
          <h1>{client.name || client.phone || `${t("clients.profile.title")} #${client.id}`}</h1>
          <div className="helper-text">
            {t("clients.profile.idLabel")}: {client.id}
          </div>
        </div>
        <div className="profile-role">
          <span className="badge">{translateStatus(locale, client.status)}</span>
        </div>
      </div>
      {error ? <div className="banner error">{t(error)}</div> : null}
      <section className="card profile-card client-profile-card">
        <ClientOverview
          client={client}
          metrics={metrics}
          loading={metricsLoading}
          phoneVisible={phoneVisible}
          onRevealPhone={handleRevealPhone}
          onManageAddresses={() => openAccordion("addresses")}
          onViewPromos={() => {
            setRewardsTab("promos");
            openAccordion("rewards");
          }}
        />

        <div className="profile-section">
          <ClientCrmNote
            value={crmNote}
            updatedAt={client.crm_updated_at}
            saving={crmSaving}
            onSave={handleSaveCrmNote}
          />
        </div>

        <div className="profile-section">
          <ClientSubscriptions
            value={subscriptions}
            saving={subscriptionsSaving}
            onSave={handleSaveSubscriptions}
          />
        </div>

        <div className="profile-section">
          <ClientDangerZone
            status={client.status}
            onAction={handleSensitiveAction}
            onBanToggle={handleBanToggle}
          />
        </div>

        <div className="profile-section">
          <div className="accordion">
            <details open={accordion.orders} onToggle={() => toggleAccordion("orders")}>
              <summary>{t("clients.accordion.orders")}</summary>
              <ClientOrders
                data={orders}
                filters={orderFilters}
                loading={ordersLoading}
                error={error}
                onFilterChange={setOrderFilters}
                onPageChange={(page) => setOrderFilters({ ...orderFilters, page })}
              />
            </details>

            <details open={accordion.addresses} onToggle={() => toggleAccordion("addresses")}>
              <summary>{t("clients.accordion.addresses")}</summary>
              <ClientAddresses
                clientId={clientId}
                addresses={addresses}
                loading={addressesLoading}
                error={error}
                role={role}
                onReload={loadAddresses}
              />
            </details>

            <details open={accordion.rewards} onToggle={() => toggleAccordion("rewards")}>
              <summary>{t("clients.rewards.title")}</summary>
              <div className="tabs">
                <button
                  type="button"
                  className={`tab ${rewardsTab === "promos" ? "active" : ""}`}
                  onClick={() => setRewardsTab("promos")}
                >
                  {t("clients.rewards.promos")}
                </button>
                <button
                  type="button"
                  className={`tab ${rewardsTab === "compensations" ? "active" : ""}`}
                  onClick={() => setRewardsTab("compensations")}
                >
                  {t("clients.rewards.compensations")}
                </button>
              </div>
              {rewardsTab === "promos" ? (
                <ClientPromos
                  clientId={clientId}
                  promos={promos}
                  loading={promosLoading}
                  error={error}
                  role={role}
                  onReload={loadPromos}
                />
              ) : (
                <ClientCompensations
                  data={compensations}
                  loading={compensationsLoading}
                  error={error}
                />
              )}
            </details>

            <details open={accordion.messages} onToggle={() => toggleAccordion("messages")}>
              <summary>{t("clients.accordion.messages")}</summary>
              <ClientMessages
                data={messages}
                loading={messagesLoading}
                error={error}
              />
            </details>

            <details open={accordion.audit} onToggle={() => toggleAccordion("audit")}>
              <summary>{t("clients.accordion.audit")}</summary>
              <ClientAudit
                data={audit}
                loading={auditLoading}
                error={error}
              />
            </details>

            <details open={accordion.notes} onToggle={() => toggleAccordion("notes")}>
              <summary>{t("clients.accordion.notes")}</summary>
              <ClientNotes
                notes={notes}
                role={role}
                authorTgId={authorTgId}
                loading={notesLoading}
                error={error}
                onAdd={handleAddNote}
                onDelete={handleDeleteNote}
              />
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

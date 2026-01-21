"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/Toast";
import ClientTabs from "./ClientTabs";
import ClientOverview from "./ClientOverview";
import ClientOrders from "./ClientOrders";
import ClientNotes from "./ClientNotes";
import ClientAddresses from "./ClientAddresses";
import ClientPromos from "./ClientPromos";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";
import { getClientAddresses } from "../../../lib/api/clientAddressesApi";
import { getClientPromos } from "../../../lib/api/clientPromosApi";

const emptyMetrics = {
  ordersCount: 0,
  totalSpent: 0,
  avgCheck: 0,
  lastOrderAt: null
};

export default function ClientProfileClient({ clientId, initialClient }) {
  const [activeTab, setActiveTab] = useState("overview");
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
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [role, setRole] = useState("support");
  const [authorTgId, setAuthorTgId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored);
    setRole(normalizeRole(parsed.role));
    setAuthorTgId(parsed.tgId || null);
  }, []);

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

  useEffect(() => {
    if (activeTab === "overview") {
      loadMetrics();
      loadAddresses();
      loadPromos();
    }
    if (activeTab === "orders") {
      loadOrders(orderFilters);
    }
    if (activeTab === "notes") {
      loadNotes();
    }
    if (activeTab === "addresses") {
      loadAddresses();
    }
    if (activeTab === "promos") {
      loadPromos();
    }
  }, [activeTab, orderFilters]);

  const handleEdit = async () => {
    const name = window.prompt("Client name", client.name || "");
    if (name === null) {
      return;
    }
    const phone = window.prompt("Phone", client.phone || "");
    if (phone === null) {
      return;
    }
    const result = await apiJson(`/api/clients/${clientId}`, {
      method: "PATCH",
      body: JSON.stringify({ name, phone })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setClient(result.data);
    setToast({ type: "success", message: "Client updated" });
  };

  const handleBlockToggle = async () => {
    const confirmText =
      client.status === "active"
        ? "Block client?"
        : "Unblock client?";
    if (!window.confirm(confirmText)) {
      return;
    }
    const result = await apiJson(`/api/clients/${clientId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: client.status === "active" ? "blocked" : "active"
      })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setClient(result.data);
    setToast({ type: "success", message: "Status updated" });
  };

  const handleAddNote = async (text) => {
    const result = await apiJson(`/api/clients/${clientId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text, author_tg_id: authorTgId })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setNotes((prev) => [result.data, ...prev]);
    setToast({ type: "success", message: "Note added" });
  };

  const handleDeleteNote = async (noteId) => {
    const result = await apiJson(`/api/clients/${clientId}/notes/${noteId}`, {
      method: "DELETE"
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    setToast({ type: "success", message: "Note deleted" });
  };

  const primaryAddress = useMemo(
    () => addresses.find((address) => address.is_primary),
    [addresses]
  );
  const lastPromo = useMemo(() => promos[0] || null, [promos]);

  return (
    <div className="profile-wrapper">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-header">
        <div>
          <div className="profile-eyebrow">Client profile</div>
          <h1>{client.name || client.phone || `Client #${client.id}`}</h1>
          <div className="helper-text">ID: {client.id}</div>
        </div>
        <div className="profile-role">
          <span className="badge">{client.status}</span>
        </div>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      <ClientTabs active={activeTab} onChange={setActiveTab} />
      {activeTab === "overview" ? (
        <ClientOverview
          client={client}
          metrics={metrics}
          loading={metricsLoading}
          onEdit={handleEdit}
          onBlockToggle={handleBlockToggle}
          primaryAddress={primaryAddress}
          lastPromo={lastPromo}
          onManageAddresses={() => setActiveTab("addresses")}
          onViewPromos={() => setActiveTab("promos")}
        />
      ) : null}
      {activeTab === "orders" ? (
        <ClientOrders
          data={orders}
          filters={orderFilters}
          loading={ordersLoading}
          error={error}
          onFilterChange={setOrderFilters}
          onPageChange={(page) => setOrderFilters({ ...orderFilters, page })}
        />
      ) : null}
      {activeTab === "addresses" ? (
        <ClientAddresses
          clientId={clientId}
          addresses={addresses}
          loading={addressesLoading}
          error={error}
          role={role}
          onReload={loadAddresses}
        />
      ) : null}
      {activeTab === "promos" ? (
        <ClientPromos
          clientId={clientId}
          promos={promos}
          loading={promosLoading}
          error={error}
          role={role}
          onReload={loadPromos}
        />
      ) : null}
      {activeTab === "notes" ? (
        <ClientNotes
          notes={notes}
          role={role}
          authorTgId={authorTgId}
          loading={notesLoading}
          error={error}
          onAdd={handleAddNote}
          onDelete={handleDeleteNote}
        />
      ) : null}
    </div>
  );
}
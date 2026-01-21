"use client";

import { useEffect, useState } from "react";
import { apiJson } from "../../../lib/api/client";
import Toast from "../../components/Toast";
import PartnerTabs from "./PartnerTabs";
import PartnerOverview from "./PartnerOverview";
import PartnerOutlets from "./PartnerOutlets";
import PartnerNotes from "./PartnerNotes";

const emptyOutlets = { items: [], page: 1, limit: 10, total: 0 };

export default function PartnerProfileClient({ partnerId, initialPartner }) {
  const [partner, setPartner] = useState(initialPartner);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [authorTgId, setAuthorTgId] = useState(null);
  const [role, setRole] = useState("support");
  const [tabState, setTabState] = useState({
    outlets: { data: emptyOutlets, loading: false, error: null },
    notes: { data: [], loading: false, error: null }
  });
  const [outletFilters, setOutletFilters] = useState({ page: 1, limit: 10 });

  useEffect(() => {
    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored);
    setRole(parsed.role || "support");
    setAuthorTgId(parsed.tgId || null);
  }, []);

  const reloadPartner = async () => {
    const result = await apiJson(`/api/partners/${partnerId}`);
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setPartner(result.data);
  };

  const loadOutlets = async (filters) => {
    setTabState((prev) => ({
      ...prev,
      outlets: { ...prev.outlets, loading: true, error: null }
    }));
    const query = new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit)
    }).toString();
    const result = await apiJson(`/api/partners/${partnerId}/outlets?${query}`);
    if (!result.ok) {
      setTabState((prev) => ({
        ...prev,
        outlets: { ...prev.outlets, loading: false, error: result.error }
      }));
      return;
    }
    setTabState((prev) => ({
      ...prev,
      outlets: { data: result.data, loading: false, error: null }
    }));
  };

  const loadNotes = async () => {
    setTabState((prev) => ({
      ...prev,
      notes: { ...prev.notes, loading: true, error: null }
    }));
    const result = await apiJson(`/api/partners/${partnerId}/notes`);
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
    if (activeTab === "outlets") {
      loadOutlets(outletFilters);
    }
    if (activeTab === "notes") {
      loadNotes();
    }
  }, [activeTab, outletFilters]);

  const handleBlockToggle = async () => {
    const nextStatus = partner.status === "blocked" ? "active" : "blocked";
    const result = await apiJson(`/api/partners/${partnerId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Status updated" });
    reloadPartner();
  };

  const handleAddNote = async (text) => {
    const result = await apiJson(`/api/partners/${partnerId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Note added" });
    loadNotes();
  };

  const handleDeleteNote = async (noteId) => {
    const result = await apiJson(`/api/partners/${partnerId}/notes/${noteId}`, {
      method: "DELETE"
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Note deleted" });
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
          <div className="profile-eyebrow">Partner profile</div>
          <h1>{partner.name}</h1>
          <div className="helper-text">ID: {partner.id}</div>
        </div>
        <div className="profile-role">
          <span className="badge">{partner.status || "active"}</span>
        </div>
      </div>

      <PartnerTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <PartnerOverview partner={partner} role={role} onBlockToggle={handleBlockToggle} />
      ) : null}
      {activeTab === "outlets" ? (
        <PartnerOutlets
          data={tabState.outlets.data}
          filters={outletFilters}
          loading={tabState.outlets.loading}
          error={tabState.outlets.error}
          onPageChange={(page) => setOutletFilters({ ...outletFilters, page })}
        />
      ) : null}
      {activeTab === "notes" ? (
        <PartnerNotes
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
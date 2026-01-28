"use client";

import { useEffect, useState } from "react";
import { apiJson } from "../../../lib/api/client";
import Toast from "../../components/Toast";
import PartnerTabs from "./PartnerTabs";
import PartnerOverview from "./PartnerOverview";
import PartnerOutlets from "./PartnerOutlets";
import PartnerFinance from "./PartnerFinance";
import PartnerNotes from "./PartnerNotes";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";
import { useAuth } from "../../components/AuthProvider";

const emptyOutlets = { items: [], page: 1, limit: 10, total: 0 };

export default function PartnerProfileClient({ partnerId, initialPartner }) {
  const { locale, t } = useLocale();
  const { user: authUser } = useAuth();
  const [partner, setPartner] = useState(initialPartner);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const authorTgId = authUser?.tg_id || null;
  const role = authUser?.role || "support";
  const [tabState, setTabState] = useState({
    outlets: { data: emptyOutlets, loading: false, error: null },
    finance: { data: { summary: [], transactions: [] }, loading: false, error: null },
    notes: { data: [], loading: false, error: null }
  });
  const [outletFilters, setOutletFilters] = useState({ page: 1, limit: 10 });

  const reloadPartner = async () => {
    const result = await apiJson(`/admin/partners/${partnerId}`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
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

  const loadFinance = async () => {
    setTabState((prev) => ({
      ...prev,
      finance: { ...prev.finance, loading: true, error: null }
    }));
    const result = await apiJson(`/api/partners/${partnerId}/finance`);
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

  useEffect(() => {
    if (activeTab === "outlets") {
      loadOutlets(outletFilters);
    }
    if (activeTab === "finance") {
      loadFinance();
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
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("partners.toasts.statusUpdated") });
    reloadPartner();
  };

  const handleVerify = async ({ action, comment }) => {
    const result = await apiJson(`/admin/partners/${partnerId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ action, comment })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("partners.toasts.verificationUpdated") });
    reloadPartner();
  };

  const handleCommissionUpdate = async (commissionPercent) => {
    const result = await apiJson(`/admin/partners/${partnerId}/commission`, {
      method: "PATCH",
      body: JSON.stringify({ commission_percent: commissionPercent })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("partners.toasts.commissionUpdated") });
    reloadPartner();
  };

  const handlePayoutHold = async (value) => {
    const result = await apiJson(`/admin/partners/${partnerId}/payout-hold`, {
      method: "PATCH",
      body: JSON.stringify({ payout_hold: value })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("partners.toasts.holdUpdated") });
    reloadPartner();
  };

  const handleAddNote = async (text) => {
    const result = await apiJson(`/api/partners/${partnerId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("partners.toasts.noteAdded") });
    loadNotes();
  };

  const handleDeleteNote = async (noteId) => {
    const result = await apiJson(`/api/partners/${partnerId}/notes/${noteId}`, {
      method: "DELETE"
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("partners.toasts.noteDeleted") });
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
          <div className="profile-eyebrow">{t("partners.profile.eyebrow")}</div>
          <h1>{partner.name}</h1>
          <div className="helper-text">
            {t("partners.profile.idLabel")}: {partner.id}
          </div>
        </div>
        <div className="profile-role">
          <span className="badge">
            {translateStatus(locale, partner.status || "active")}
          </span>
        </div>
      </div>

      <PartnerTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <PartnerOverview
          partner={partner}
          role={role}
          onBlockToggle={handleBlockToggle}
          onVerify={handleVerify}
          onCommissionUpdate={handleCommissionUpdate}
          onPayoutHold={handlePayoutHold}
        />
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
      {activeTab === "finance" ? (
        <PartnerFinance
          data={tabState.finance.data}
          loading={tabState.finance.loading}
          error={tabState.finance.error}
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

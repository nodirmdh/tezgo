"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

export default function PartnerListClient() {
  const { locale, t } = useLocale();
  const [filters, setFilters] = useState({ status: "", payout_hold: "", page: 1, limit: 10 });
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, dialog } = useConfirm();

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({});
    if (filters.status) {
      params.set("status", filters.status);
    }
    if (filters.payout_hold) {
      params.set("payout_hold", filters.payout_hold);
    }
    const result = await apiJson(`/admin/partners?${params.toString()}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    const items = result.data.items || [];
    setData({ items, page: 1, limit: items.length, total: items.length });
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchPartners, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleBlockToggle = async (partner) => {
    const nextStatus = partner.status === "blocked" ? "active" : "blocked";
    confirm({
      title:
        nextStatus === "blocked"
          ? t("partners.actions.blockConfirm")
          : t("partners.actions.unblockConfirm"),
      description: t("partners.actions.confirmDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/partners/${partner.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("partners.toasts.statusUpdated") });
        fetchPartners();
      }
    });
  };

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="toolbar">
        <div className="toolbar-actions">
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value, page: 1 })
            }
          >
            <option value="">{t("partners.filters.allVerification")}</option>
            {["draft", "submitted", "verified", "rejected"].map((status) => (
              <option key={status} value={status}>
                {t(`partners.verification.${status}`)}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.payout_hold}
            onChange={(event) =>
              setFilters({ ...filters, payout_hold: event.target.value, page: 1 })
            }
          >
            <option value="">{t("partners.filters.allHolds")}</option>
            <option value="true">{t("partners.filters.onHold")}</option>
            <option value="false">{t("partners.filters.offHold")}</option>
          </select>
        </div>
      </div>

      {error ? <div className="banner error">{t(error)}</div> : null}
      {loading ? (
        <div className="form-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("partners.table.partner")}</th>
              <th>{t("partners.table.verification")}</th>
              <th>{t("partners.table.commission")}</th>
              <th>{t("partners.table.payoutHold")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((partner) => (
              <tr key={partner.id}>
                <td>{partner.display_name || partner.name || partner.legal_name}</td>
                <td>
                  <span className="badge">
                    {t(`partners.verification.${partner.verification_status || "draft"}`)}
                  </span>
                </td>
                <td>{Number(partner.commission_percent || 0).toFixed(2)}%</td>
                <td>{partner.payout_hold ? t("common.yes") : t("common.no")}</td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/partners/${partner.id}`}>
                      {t("common.view")}
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleBlockToggle(partner)}
                    >
                      {partner.status === "blocked"
                        ? t("partners.actions.unblock")
                        : t("partners.actions.block")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Toast from "../../../components/Toast";
import { apiJson } from "../../../../lib/api/client";
import { useLocale } from "../../../components/LocaleProvider";

export default function PartnerPayoutReportClient() {
  const { t } = useLocale();
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    const params = new URLSearchParams({});
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const result = await apiJson(`/admin/partners/payout-report?${params.toString()}`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setLoading(false);
      return;
    }
    setItems(result.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchReport, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            type="date"
            value={filters.from}
            onChange={(event) => setFilters({ ...filters, from: event.target.value })}
          />
          <input
            className="input"
            type="date"
            value={filters.to}
            onChange={(event) => setFilters({ ...filters, to: event.target.value })}
          />
          <a
            className="button ghost"
            href={`/admin/partners/payout-report/export?from=${filters.from}&to=${filters.to}`}
            target="_blank"
            rel="noreferrer"
          >
            {t("partners.payouts.export")}
          </a>
        </div>
      </div>
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
              <th>{t("partners.payouts.partner")}</th>
              <th>{t("partners.payouts.foodTotal")}</th>
              <th>{t("partners.payouts.commission")}</th>
              <th>{t("partners.payouts.partnerNet")}</th>
              <th>{t("partners.payouts.serviceFee")}</th>
              <th>{t("partners.payouts.status")}</th>
              <th>{t("partners.payouts.hold")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.partner_id}>
                <td>{item.partner_name || item.partner_id}</td>
                <td>{item.food_total_sum || 0}</td>
                <td>{item.commission_sum || 0}</td>
                <td>{item.partner_net_sum || 0}</td>
                <td>{item.service_fee_sum || 0}</td>
                <td>{item.verification_status || "-"}</td>
                <td>{item.payout_hold ? t("common.yes") : t("common.no")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

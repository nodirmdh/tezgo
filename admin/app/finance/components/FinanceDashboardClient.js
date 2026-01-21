"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const statusOptions = ["", "pending", "completed"];
const typeOptions = [
  "",
  "commission",
  "courier_payout",
  "penalty",
  "payment",
  "refund",
  "bonus"
];

export default function FinanceDashboardClient() {
  const { locale, t } = useLocale();
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    type: "",
    outlet_id: "",
    partner_id: "",
    date_from: "",
    date_to: ""
  });
  const [summary, setSummary] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const fetchFinance = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== "" && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {})
    ).toString();

    const [summaryResult, ledgerResult] = await Promise.all([
      apiJson(`/api/finance/summary?${params}`),
      apiJson(`/api/finance/ledger?${params}`)
    ]);

    if (!summaryResult.ok || !ledgerResult.ok) {
      setError(summaryResult.error || ledgerResult.error);
      setLoading(false);
      return;
    }

    setSummary(summaryResult.data || []);
    setTransactions(ledgerResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchFinance, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const totalAmount = useMemo(
    () => summary.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [summary]
  );

  const handleExport = () => {
    if (!transactions.length) {
      setToast({ type: "error", message: t("finance.noExport") });
      return;
    }
    const headers = [
      "id",
      "title",
      "amount",
      "status",
      "type",
      "created_at",
      "order_number",
      "outlet_name",
      "partner_name"
    ];
    const rows = transactions.map((row) =>
      headers.map((key) => JSON.stringify(row[key] ?? "")).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "finance.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            placeholder={t("finance.searchTitle")}
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value })
            }
          />
          <select
            className="select"
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value })
            }
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option ? translateStatus(locale, option) : t("finance.allStatuses")}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.type}
            onChange={(event) =>
              setFilters({ ...filters, type: event.target.value })
            }
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option ? t(`finance.types.${option}`) : t("finance.allTypes")}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder={t("finance.outletId")}
            value={filters.outlet_id}
            onChange={(event) =>
              setFilters({ ...filters, outlet_id: event.target.value })
            }
          />
          <input
            className="input"
            placeholder={t("finance.partnerId")}
            value={filters.partner_id}
            onChange={(event) =>
              setFilters({ ...filters, partner_id: event.target.value })
            }
          />
          <input
            className="input"
            type="date"
            value={filters.date_from}
            onChange={(event) =>
              setFilters({ ...filters, date_from: event.target.value })
            }
          />
          <input
            className="input"
            type="date"
            value={filters.date_to}
            onChange={(event) =>
              setFilters({ ...filters, date_to: event.target.value })
            }
          />
          <button className="button" type="button" onClick={handleExport}>
            {t("finance.export")}
          </button>
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
        <>
          <div className="cards">
            <div className="card">
              <div style={{ color: "#64748B", fontSize: "13px" }}>
                {t("finance.total")}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 600, marginTop: "6px" }}>
                {totalAmount}
              </div>
            </div>
            {summary.map((item) => (
              <div key={item.type} className="card">
                <div style={{ color: "#64748B", fontSize: "13px" }}>
                  {t(`finance.types.${item.type}`, { defaultValue: item.type })}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 600, marginTop: "6px" }}>
                  {item.amount}
                </div>
              </div>
            ))}
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">{t("finance.noData")}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("finance.table.title")}</th>
                  <th>{t("finance.table.amount")}</th>
                  <th>{t("finance.table.status")}</th>
                  <th>{t("finance.table.type")}</th>
                  <th>{t("finance.table.order")}</th>
                  <th>{t("finance.table.outlet")}</th>
                  <th>{t("finance.table.partner")}</th>
                  <th>{t("finance.table.date")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.amount}</td>
                    <td>
                      <span className="badge">
                        {translateStatus(locale, row.status)}
                      </span>
                    </td>
                    <td>{t(`finance.types.${row.type}`, { defaultValue: row.type })}</td>
                    <td>{row.order_number || "-"}</td>
                    <td>{row.outlet_name || "-"}</td>
                    <td>{row.partner_name || "-"}</td>
                    <td>{row.created_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

export default function ProblemFlagsClient() {
  const { t } = useLocale();
  const [filters, setFilters] = useState({
    severity: "",
    type: "",
    resolved: "false"
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchFlags = async () => {
    setLoading(true);
    const params = new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (!value) return acc;
        acc[key] = value;
        return acc;
      }, {})
    ).toString();
    const result = await apiJson(`/admin/problem-flags?${params}`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setLoading(false);
      return;
    }
    setData(result.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchFlags, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const resolveFlag = async (flagId) => {
    const result = await apiJson(`/admin/problem-flags/${flagId}/resolve`, {
      method: "PATCH"
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("flags.resolved") });
    fetchFlags();
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
          <select
            className="select"
            value={filters.severity}
            onChange={(event) =>
              setFilters({ ...filters, severity: event.target.value })
            }
          >
            <option value="">{t("flags.filters.allSeverity")}</option>
            <option value="high">{t("orders.severity.high")}</option>
            <option value="medium">{t("orders.severity.medium")}</option>
            <option value="low">{t("orders.severity.low")}</option>
          </select>
          <select
            className="select"
            value={filters.type}
            onChange={(event) =>
              setFilters({ ...filters, type: event.target.value })
            }
          >
            <option value="">{t("flags.filters.allTypes")}</option>
            <option value="partner_not_responding">{t("flags.types.partner_not_responding")}</option>
            <option value="cooking_delay">{t("flags.types.cooking_delay")}</option>
            <option value="no_courier_assigned">{t("flags.types.no_courier_assigned")}</option>
            <option value="courier_delay">{t("flags.types.courier_delay")}</option>
            <option value="frequent_cancellations">{t("flags.types.frequent_cancellations")}</option>
            <option value="handoff_code_failed_attempts">{t("flags.types.handoff_code_failed_attempts")}</option>
          </select>
          <select
            className="select"
            value={filters.resolved}
            onChange={(event) =>
              setFilters({ ...filters, resolved: event.target.value })
            }
          >
            <option value="false">{t("flags.filters.active")}</option>
            <option value="true">{t("flags.filters.resolved")}</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="form-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">{t("flags.empty")}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("flags.table.order")}</th>
              <th>{t("flags.table.type")}</th>
              <th>{t("flags.table.severity")}</th>
              <th>{t("flags.table.created")}</th>
              <th>{t("flags.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((flag) => (
              <tr key={flag.id}>
                <td>
                  <Link className="action-link" href={`/orders/${flag.order_id}?tab=flags`}>
                    #{flag.order_id}
                  </Link>
                </td>
                <td>{t(`flags.types.${flag.type}`, { defaultValue: flag.type })}</td>
                <td>
                  <span className={`badge severity ${flag.severity}`}>
                    {t(`orders.severity.${flag.severity}`, { defaultValue: flag.severity })}
                  </span>
                </td>
                <td>{flag.created_at}</td>
                <td>
                  {flag.resolved_at ? (
                    <span className="badge">{t("flags.resolved")}</span>
                  ) : (
                    <button className="action-link" type="button" onClick={() => resolveFlag(flag.id)}>
                      {t("flags.resolve")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

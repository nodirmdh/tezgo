"use client";

import { useEffect, useState } from "react";
import Toast from "../../../components/Toast";
import { apiJson } from "../../../../lib/api/client";
import { useLocale } from "../../../components/LocaleProvider";

export default function CourierLeaderboardClient() {
  const { t } = useLocale();
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchLeaders = async () => {
    setLoading(true);
    const params = new URLSearchParams({});
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const result = await apiJson(`/admin/couriers/leaderboard?${params.toString()}`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      setLoading(false);
      return;
    }
    setItems(result.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchLeaders, 300);
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
              <th>{t("couriers.table.courier")}</th>
              <th>{t("couriers.leaderboard.delivered")}</th>
              <th>{t("couriers.leaderboard.cancelled")}</th>
              <th>{t("couriers.leaderboard.avgTime")}</th>
              <th>{t("couriers.leaderboard.penalties")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.courier_user_id}>
                <td>{item.username || item.courier_user_id}</td>
                <td>{item.delivered_count}</td>
                <td>{item.cancel_count}</td>
                <td>{item.avg_delivery_time ? `${item.avg_delivery_time}m` : "-"}</td>
                <td>{item.penalty_sum || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

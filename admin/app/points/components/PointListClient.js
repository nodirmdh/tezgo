"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

export default function PointListClient() {
  const { t } = useLocale();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPoints = async () => {
    setLoading(true);
    setError(null);
    const result = await apiJson("/admin/points");
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setItems(result.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  return (
    <section>
      <Toast message={error} type="error" onClose={() => setError(null)} />
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
              <th>{t("points.table.name")}</th>
              <th>{t("points.table.partner")}</th>
              <th>{t("points.table.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((point) => (
              <tr key={point.id}>
                <td>{point.name}</td>
                <td>{point.partner_id}</td>
                <td>{point.status}</td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/points/${point.id}`}>
                      {t("common.view")}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  {t("points.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      )}
    </section>
  );
}

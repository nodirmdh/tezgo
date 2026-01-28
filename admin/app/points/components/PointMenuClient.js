"use client";

import { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

const buildDrafts = (items) =>
  items.reduce((acc, item) => {
    acc[item.id] = {
      price: item.price ?? "",
      categoryId: item.category_id ? String(item.category_id) : "",
      is_available: Boolean(item.is_available)
    };
    return acc;
  }, {});

export default function PointMenuClient({ pointId }) {
  const { t } = useLocale();
  const [point, setPoint] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [pointResult, categoriesResult, itemsResult] = await Promise.all([
      apiJson(`/admin/points/${pointId}`),
      apiJson(`/admin/points/${pointId}/categories`),
      apiJson(`/admin/points/${pointId}/items`)
    ]);
    if (!pointResult.ok) {
      setError(pointResult.error);
      setLoading(false);
      return;
    }
    if (!categoriesResult.ok || !itemsResult.ok) {
      setError(categoriesResult.error || itemsResult.error);
      setLoading(false);
      return;
    }
    const itemsList = itemsResult.data.items || [];
    setPoint(pointResult.data);
    setCategories(categoriesResult.data.items || []);
    setItems(itemsList);
    setDrafts(buildDrafts(itemsList));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [pointId]);

  const updateDraft = (id, field, value) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (itemId) => {
    const draft = drafts[itemId];
    const payload = {
      price: Number(draft.price),
      is_available: Boolean(draft.is_available)
    };
    if (draft.categoryId) {
      payload.categoryId = Number(draft.categoryId);
    }
    const result = await apiJson(`/admin/points/${pointId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToast(t("points.toasts.saved"));
    loadData();
  };

  const toggleAvailability = async (itemId, nextValue) => {
    const result = await apiJson(`/admin/points/${pointId}/items/${itemId}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ is_available: nextValue })
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToast(t("points.toasts.availability"));
    loadData();
  };

  return (
    <section>
      <Toast message={toast} type="success" onClose={() => setToast(null)} />
      <Toast message={error} type="error" onClose={() => setError(null)} />
      {loading ? (
        <div className="form-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-title">{t("points.menu.title", { name: point?.name || "-" })}</div>
          <table className="table">
            <thead>
              <tr>
                <th>{t("points.menu.table.name")}</th>
                <th>{t("points.menu.table.category")}</th>
                <th>{t("points.menu.table.price")}</th>
                <th>{t("points.menu.table.available")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <select
                      className="select"
                      value={drafts[item.id]?.categoryId || ""}
                      onChange={(event) => updateDraft(item.id, "categoryId", event.target.value)}
                    >
                      <option value="">{t("points.menu.noCategory")}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      value={drafts[item.id]?.price ?? ""}
                      onChange={(event) => updateDraft(item.id, "price", event.target.value)}
                      style={{ width: "120px" }}
                    />
                  </td>
                  <td>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        toggleAvailability(item.id, !drafts[item.id]?.is_available)
                      }
                    >
                      {drafts[item.id]?.is_available ? t("common.yes") : t("common.no")}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-link"
                        type="button"
                        onClick={() => handleSave(item.id)}
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {t("points.menu.empty")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import Modal from "../../components/Modal";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

const statusOptions = [
  { value: "", labelKey: "promos.filters.all" },
  { value: "1", labelKey: "promos.status.active" },
  { value: "0", labelKey: "promos.status.inactive" }
];

export default function PromoListClient() {
  const { t } = useLocale();
  const [filters, setFilters] = useState({ q: "", is_active: "", page: 1, limit: 10 });
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: "",
    description: "",
    discount_percent: 0,
    max_uses: 0,
    used_count: 0,
    is_active: 1,
    starts_at: "",
    ends_at: "",
    min_order_amount: "",
    outlet_ids: [],
    apply_all_outlets: true,
    first_order_only: 0
  });
  const { confirm, dialog } = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))),
    [data.total, data.limit]
  );

  const fetchPromos = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: filters.q,
      is_active: filters.is_active
    }).toString();
    const result = await apiJson(`/api/promos?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    const items = result.data || [];
    const page = filters.page;
    const limit = filters.limit;
    const start = (page - 1) * limit;
    const pageItems = items.slice(start, start + limit);
    setData({ items: pageItems, page, limit, total: items.length });
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchPromos, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const loadOutlets = async () => {
      const result = await apiJson("/api/outlets/list?limit=200&page=1");
      if (!result.ok) {
        return;
      }
      setOutlets(result.data.items || []);
    };
    loadOutlets();
  }, []);

  const handleToggle = (promo) => {
    const nextStatus = promo.is_active ? 0 : 1;
    confirm({
      title: nextStatus ? t("promos.actions.activateTitle") : t("promos.actions.deactivateTitle"),
      description: t("promos.actions.confirmDescription"),
      onConfirm: async () => {
        const result = await apiJson(`/api/promos/${promo.id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: nextStatus })
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("promos.actions.statusUpdated") });
        fetchPromos();
      }
    });
  };

  const toggleOutlet = (outletId) => {
    setCreateForm((current) => {
      const exists = current.outlet_ids.includes(outletId);
      const nextIds = exists
        ? current.outlet_ids.filter((id) => id !== outletId)
        : [...current.outlet_ids, outletId];
      return { ...current, outlet_ids: nextIds };
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const payload = {
      code: createForm.code || null,
      description: createForm.description || null,
      discount_percent:
        createForm.discount_percent !== "" ? Number(createForm.discount_percent) : 0,
      max_uses: createForm.max_uses !== "" ? Number(createForm.max_uses) : 0,
      used_count: createForm.used_count !== "" ? Number(createForm.used_count) : 0,
      is_active: Number(createForm.is_active),
      starts_at: createForm.starts_at || null,
      ends_at: createForm.ends_at || null,
      min_order_amount:
        createForm.min_order_amount !== "" ? Number(createForm.min_order_amount) : null,
      outlet_ids: createForm.apply_all_outlets ? [] : createForm.outlet_ids,
      first_order_only: Number(createForm.first_order_only)
    };
    const result = await apiJson("/api/promos", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("promos.toasts.created") });
    setCreateOpen(false);
    setCreateForm({
      code: "",
      description: "",
      discount_percent: 0,
      max_uses: 0,
      used_count: 0,
      is_active: 1,
      starts_at: "",
      ends_at: "",
      min_order_amount: "",
      outlet_ids: [],
      apply_all_outlets: true,
      first_order_only: 0
    });
    fetchPromos();
  };

  const renderOutlets = (promo) => {
    if (promo.outlet_names?.length) {
      return promo.outlet_names.join(", ");
    }
    return t("promos.table.allOutlets");
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
          <input
            className="input"
            placeholder={t("promos.filters.search")}
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value, page: 1 })
            }
          />
          <select
            className="select"
            value={filters.is_active}
            onChange={(event) =>
              setFilters({ ...filters, is_active: event.target.value, page: 1 })
            }
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <button className="button" type="button" onClick={() => setCreateOpen(true)}>
            {t("promos.actions.create")}
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
        <table className="table">
          <thead>
            <tr>
              <th>{t("promos.table.code")}</th>
              <th>{t("promos.table.discount")}</th>
              <th>{t("promos.table.outlets")}</th>
              <th>{t("promos.table.usage")}</th>
              <th>{t("promos.table.status")}</th>
              <th>{t("orders.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((promo) => (
              <tr key={promo.id}>
                <td>{promo.code}</td>
                <td>{promo.discount_percent}%</td>
                <td>{renderOutlets(promo)}</td>
                <td>
                  {promo.used_count}/{promo.max_uses}
                </td>
                <td>
                  <span className="badge">
                    {promo.is_active ? t("promos.status.active") : t("promos.status.inactive")}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/promos/${promo.id}`}>
                      {t("common.view")}
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleToggle(promo)}
                    >
                      {promo.is_active ? t("promos.actions.deactivate") : t("promos.actions.activate")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <button
          className="button"
          type="button"
          disabled={filters.page <= 1}
          onClick={() =>
            setFilters({ ...filters, page: Math.max(1, filters.page - 1) })
          }
        >
          {t("common.back")}
        </button>
        <div className="helper-text">
          {t("common.page", { page: filters.page, total: totalPages })}
        </div>
        <button
          className="button"
          type="button"
          disabled={filters.page >= totalPages}
          onClick={() =>
            setFilters({
              ...filters,
              page: Math.min(totalPages, filters.page + 1)
            })
          }
        >
          {t("common.next")}
        </button>
      </div>
      <Modal open={createOpen} title={t("promos.actions.create")} onClose={() => setCreateOpen(false)}>
        <form className="form-grid" onSubmit={handleCreate}>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoCreateCode">{t("promos.form.code")}</label>
              <input
                id="promoCreateCode"
                className="input"
                value={createForm.code}
                onChange={(event) =>
                  setCreateForm({ ...createForm, code: event.target.value })
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="promoCreateDesc">{t("promos.form.description")}</label>
              <input
                id="promoCreateDesc"
                className="input"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm({ ...createForm, description: event.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoCreateDiscount">{t("promos.form.discount")}</label>
              <input
                id="promoCreateDiscount"
                className="input"
                value={createForm.discount_percent}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    discount_percent: event.target.value
                  })
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="promoCreateMax">{t("promos.form.maxUses")}</label>
              <input
                id="promoCreateMax"
                className="input"
                value={createForm.max_uses}
                onChange={(event) =>
                  setCreateForm({ ...createForm, max_uses: event.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoCreateUsed">{t("promos.form.usedCount")}</label>
              <input
                id="promoCreateUsed"
                className="input"
                value={createForm.used_count}
                onChange={(event) =>
                  setCreateForm({ ...createForm, used_count: event.target.value })
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="promoCreateActive">{t("promos.form.active")}</label>
              <select
                id="promoCreateActive"
                className="select"
                value={createForm.is_active}
                onChange={(event) =>
                  setCreateForm({ ...createForm, is_active: event.target.value })
                }
              >
                <option value={1}>{t("promos.status.active")}</option>
                <option value={0}>{t("promos.status.inactive")}</option>
              </select>
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoCreateStart">{t("promos.form.startsAt")}</label>
              <input
                id="promoCreateStart"
                className="input"
                type="datetime-local"
                value={createForm.starts_at}
                onChange={(event) =>
                  setCreateForm({ ...createForm, starts_at: event.target.value })
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="promoCreateEnd">{t("promos.form.endsAt")}</label>
              <input
                id="promoCreateEnd"
                className="input"
                type="datetime-local"
                value={createForm.ends_at}
                onChange={(event) =>
                  setCreateForm({ ...createForm, ends_at: event.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="promoCreateMin">{t("promos.form.minOrderAmount")}</label>
              <input
                id="promoCreateMin"
                className="input"
                value={createForm.min_order_amount}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    min_order_amount: event.target.value
                  })
                }
              />
            </div>
            <div className="auth-field">
              <label className="checkbox" htmlFor="promoCreateAllOutlets">
                <input
                  id="promoCreateAllOutlets"
                  type="checkbox"
                  checked={createForm.apply_all_outlets}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      apply_all_outlets: event.target.checked,
                      outlet_ids: event.target.checked ? [] : createForm.outlet_ids
                    })
                  }
                />
                {t("promos.form.allOutlets")}
              </label>
            </div>
          </div>
          {!createForm.apply_all_outlets ? (
            <div className="auth-field">
              <label>{t("promos.form.outlets")}</label>
              <div className="tag-list">
                {outlets.map((outlet) => (
                  <label key={outlet.id} className="checkbox">
                    <input
                      type="checkbox"
                      checked={createForm.outlet_ids.includes(outlet.id)}
                      onChange={() => toggleOutlet(outlet.id)}
                    />
                    {outlet.name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <div className="form-row">
            <div className="auth-field">
              <label htmlFor="promoCreateFirst">{t("promos.form.firstOrderOnly")}</label>
              <select
                id="promoCreateFirst"
                className="select"
                value={createForm.first_order_only}
                onChange={(event) =>
                  setCreateForm({ ...createForm, first_order_only: event.target.value })
                }
              >
                <option value={0}>{t("common.no")}</option>
                <option value={1}>{t("common.yes")}</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="button" type="submit">
              {t("common.create")}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

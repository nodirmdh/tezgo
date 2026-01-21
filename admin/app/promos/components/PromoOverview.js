"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../../lib/api/client";
import { useLocale } from "../../components/LocaleProvider";

export default function PromoOverview({ promo, onUpdate }) {
  const { t } = useLocale();
  const initialOutletIds = useMemo(() => {
    if (Array.isArray(promo.outlet_ids)) {
      return promo.outlet_ids;
    }
    if (promo.outlet_id) {
      return [promo.outlet_id];
    }
    return [];
  }, [promo.outlet_id, promo.outlet_ids]);
  const [outlets, setOutlets] = useState([]);
  const [form, setForm] = useState({
    code: promo.code || "",
    description: promo.description || "",
    discount_percent: promo.discount_percent ?? 0,
    max_uses: promo.max_uses ?? 0,
    used_count: promo.used_count ?? 0,
    is_active: promo.is_active ? 1 : 0,
    starts_at: promo.starts_at || "",
    ends_at: promo.ends_at || "",
    min_order_amount: promo.min_order_amount ?? "",
    outlet_ids: initialOutletIds,
    apply_all_outlets: initialOutletIds.length === 0,
    first_order_only: promo.first_order_only ?? 0
  });

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

  const toggleOutlet = (outletId) => {
    setForm((current) => {
      const exists = current.outlet_ids.includes(outletId);
      const nextIds = exists
        ? current.outlet_ids.filter((id) => id !== outletId)
        : [...current.outlet_ids, outletId];
      return { ...current, outlet_ids: nextIds };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      code: form.code || null,
      description: form.description || null,
      discount_percent: form.discount_percent !== "" ? Number(form.discount_percent) : null,
      max_uses: form.max_uses !== "" ? Number(form.max_uses) : null,
      used_count: form.used_count !== "" ? Number(form.used_count) : null,
      is_active: Number(form.is_active),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      min_order_amount: form.min_order_amount !== "" ? Number(form.min_order_amount) : null,
      outlet_ids: form.apply_all_outlets ? [] : form.outlet_ids,
      first_order_only: Number(form.first_order_only)
    };
    onUpdate(payload);
  };

  return (
    <section className="card profile-card">
      <div className="profile-title">{t("tabs.overview")}</div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="promoCode">{t("promos.form.code")}</label>
            <input
              id="promoCode"
              className="input"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="promoDesc">{t("promos.form.description")}</label>
            <input
              id="promoDesc"
              className="input"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="promoDiscount">{t("promos.form.discount")}</label>
            <input
              id="promoDiscount"
              className="input"
              value={form.discount_percent}
              onChange={(event) =>
                setForm({ ...form, discount_percent: event.target.value })
              }
            />
          </div>
          <div className="auth-field">
            <label htmlFor="promoMax">{t("promos.form.maxUses")}</label>
            <input
              id="promoMax"
              className="input"
              value={form.max_uses}
              onChange={(event) => setForm({ ...form, max_uses: event.target.value })}
            />
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="promoUsed">{t("promos.form.usedCount")}</label>
            <input
              id="promoUsed"
              className="input"
              value={form.used_count}
              onChange={(event) => setForm({ ...form, used_count: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="promoActive">{t("promos.form.active")}</label>
            <select
              id="promoActive"
              className="select"
              value={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.value })}
            >
              <option value={1}>{t("promos.status.active")}</option>
              <option value={0}>{t("promos.status.inactive")}</option>
            </select>
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="promoStart">{t("promos.form.startsAt")}</label>
            <input
              id="promoStart"
              className="input"
              type="datetime-local"
              value={form.starts_at}
              onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="promoEnd">{t("promos.form.endsAt")}</label>
            <input
              id="promoEnd"
              className="input"
              type="datetime-local"
              value={form.ends_at}
              onChange={(event) => setForm({ ...form, ends_at: event.target.value })}
            />
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="promoMin">{t("promos.form.minOrderAmount")}</label>
            <input
              id="promoMin"
              className="input"
              value={form.min_order_amount}
              onChange={(event) =>
                setForm({ ...form, min_order_amount: event.target.value })
              }
            />
          </div>
          <div className="auth-field">
            <label className="checkbox" htmlFor="promoAllOutlets">
              <input
                id="promoAllOutlets"
                type="checkbox"
                checked={form.apply_all_outlets}
                onChange={(event) =>
                  setForm({
                    ...form,
                    apply_all_outlets: event.target.checked,
                    outlet_ids: event.target.checked ? [] : form.outlet_ids
                  })
                }
              />
              {t("promos.form.allOutlets")}
            </label>
          </div>
        </div>
        <div className="form-row">
          <div className="auth-field">
            <label htmlFor="promoFirst">{t("promos.form.firstOrderOnly")}</label>
            <select
              id="promoFirst"
              className="select"
              value={form.first_order_only}
              onChange={(event) =>
                setForm({ ...form, first_order_only: event.target.value })
              }
            >
              <option value={0}>{t("common.no")}</option>
              <option value={1}>{t("common.yes")}</option>
            </select>
          </div>
        </div>
        {!form.apply_all_outlets ? (
          <div className="auth-field">
            <label>{t("promos.form.outlets")}</label>
            <div className="tag-list">
              {outlets.map((outlet) => (
                <label key={outlet.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.outlet_ids.includes(outlet.id)}
                    onChange={() => toggleOutlet(outlet.id)}
                  />
                  {outlet.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <button className="button" type="submit">
          {t("common.save")}
        </button>
      </form>
    </section>
  );
}

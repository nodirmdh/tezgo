"use client";

import { useState } from "react";

export default function PromoOverview({ promo, onUpdate }) {
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
    outlet_id: promo.outlet_id ?? "",
    first_order_only: promo.first_order_only ?? 0
  });

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
      outlet_id: form.outlet_id !== "" ? Number(form.outlet_id) : null,
      first_order_only: Number(form.first_order_only)
    };
    onUpdate(payload);
  };

  return (
    <section className="card profile-card">
      <div className="profile-title">Overview</div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="promoCode">Code</label>
            <input
              id="promoCode"
              className="input"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="promoDesc">Description</label>
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
            <label htmlFor="promoDiscount">Discount %</label>
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
            <label htmlFor="promoMax">Max uses</label>
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
            <label htmlFor="promoUsed">Used count</label>
            <input
              id="promoUsed"
              className="input"
              value={form.used_count}
              onChange={(event) => setForm({ ...form, used_count: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="promoActive">Active</label>
            <select
              id="promoActive"
              className="select"
              value={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.value })}
            >
              <option value={1}>active</option>
              <option value={0}>inactive</option>
            </select>
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="promoStart">Starts at</label>
            <input
              id="promoStart"
              className="input"
              type="datetime-local"
              value={form.starts_at}
              onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="promoEnd">Ends at</label>
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
            <label htmlFor="promoMin">Min order amount</label>
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
            <label htmlFor="promoOutlet">Outlet ID</label>
            <input
              id="promoOutlet"
              className="input"
              value={form.outlet_id}
              onChange={(event) => setForm({ ...form, outlet_id: event.target.value })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="auth-field">
            <label htmlFor="promoFirst">First order only</label>
            <select
              id="promoFirst"
              className="select"
              value={form.first_order_only}
              onChange={(event) =>
                setForm({ ...form, first_order_only: event.target.value })
              }
            >
              <option value={0}>no</option>
              <option value={1}>yes</option>
            </select>
          </div>
        </div>
        <button className="button" type="submit">
          Save
        </button>
      </form>
    </section>
  );
}
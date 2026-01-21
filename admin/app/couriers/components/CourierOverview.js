"use client";

import { useEffect, useMemo, useState } from "react";
import { can } from "../../../lib/rbac";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const methodOptions = [
  { value: "walk", labelKey: "couriers.methods.walk" },
  { value: "bike", labelKey: "couriers.methods.bike" },
  { value: "car", labelKey: "couriers.methods.car" }
];

const parseMethods = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export default function CourierOverview({ courier, role, onBlockToggle, onSave }) {
  const { locale, t } = useLocale();
  const canBlock = can("block", role);
  const canEdit = can("edit", role);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    delivery_methods: [],
    rating_avg: "",
    rating_count: "",
    is_active: courier.is_active ? 1 : 0
  });

  useEffect(() => {
    setForm({
      full_name: courier.full_name || "",
      phone: courier.phone || "",
      address: courier.address || "",
      delivery_methods: parseMethods(courier.delivery_methods),
      rating_avg: courier.rating_avg ?? "",
      rating_count: courier.rating_count ?? "",
      is_active: courier.is_active ? 1 : 0
    });
  }, [courier]);

  const formattedMethods = useMemo(() => {
    const list = parseMethods(courier.delivery_methods);
    if (!list.length) return "-";
    return list
      .map((item) => t(`couriers.methods.${item}`, { defaultValue: item }))
      .join(", ");
  }, [courier.delivery_methods, t]);

  const formatRating = (item) =>
    item.rating_avg
      ? `${Number(item.rating_avg).toFixed(1)} (${item.rating_count || 0})`
      : "-";

  const toggleMethod = (value) => {
    setForm((prev) => {
      const exists = prev.delivery_methods.includes(value);
      const next = exists
        ? prev.delivery_methods.filter((item) => item !== value)
        : [...prev.delivery_methods, value];
      return { ...prev, delivery_methods: next };
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!onSave) return;
    await onSave({
      full_name: form.full_name || null,
      phone: form.phone || null,
      address: form.address || null,
      delivery_methods: form.delivery_methods.join(","),
      rating_avg: form.rating_avg === "" ? null : Number(form.rating_avg),
      rating_count: form.rating_count === "" ? null : Number(form.rating_count),
      is_active: Number(form.is_active) === 1
    });
    setEditing(false);
  };

  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">{t("couriers.overview.title")}</div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.name")}</span>
          <span>{courier.full_name || courier.username || courier.tg_id || `${t("couriers.profile.title")} #${courier.id}`}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.phone")}</span>
          <span>{courier.phone || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.address")}</span>
          <span>{courier.address || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.deliveryMethods")}</span>
          <span>{formattedMethods}</span>
        </div>
        <div className="profile-row">
          <span className="muted">TG</span>
          <span>{courier.tg_id || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.status")}</span>
          <span>{translateStatus(locale, courier.user_status || "active")}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.online")}</span>
          <span>{courier.is_active ? t("couriers.status.online") : t("couriers.status.offline")}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.rating")}</span>
          <span>{formatRating(courier)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.createdAt")}</span>
          <span>{formatDate(courier.created_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("couriers.fields.updatedAt")}</span>
          <span>{formatDate(courier.updated_at)}</span>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">{t("common.actions")}</div>
        <div className="action-grid">
          <button
            className="button"
            type="button"
            onClick={onBlockToggle}
            disabled={!canBlock}
          >
            {courier.user_status === "blocked"
              ? t("couriers.actions.unblock")
              : t("couriers.actions.block")}
          </button>
          {canEdit ? (
            <button
              className="button ghost"
              type="button"
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? t("common.cancel") : t("common.edit")}
            </button>
          ) : null}
          {!canBlock ? (
            <div className="helper-text">{t("couriers.actions.noAccess")}</div>
          ) : null}
        </div>
        {editing ? (
          <form className="form-grid" onSubmit={handleSave}>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="courierFullName">{t("couriers.fields.fullName")}</label>
                <input
                  id="courierFullName"
                  className="input"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="courierPhone">{t("couriers.fields.phone")}</label>
                <input
                  id="courierPhone"
                  className="input"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="courierAddress">{t("couriers.fields.address")}</label>
                <input
                  id="courierAddress"
                  className="input"
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label>{t("couriers.fields.deliveryMethods")}</label>
                <div className="checkbox-grid">
                  {methodOptions.map((option) => (
                    <label key={option.value} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.delivery_methods.includes(option.value)}
                        onChange={() => toggleMethod(option.value)}
                      />
                      <span>{t(option.labelKey)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-row two">
              <div className="auth-field">
                <label htmlFor="courierStatus">{t("couriers.fields.online")}</label>
                <select
                  id="courierStatus"
                  className="select"
                  value={form.is_active}
                  onChange={(event) => setForm({ ...form, is_active: event.target.value })}
                >
                  <option value={1}>{t("couriers.status.online")}</option>
                  <option value={0}>{t("couriers.status.offline")}</option>
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="courierRating">{t("couriers.fields.rating")}</label>
                <input
                  id="courierRating"
                  type="number"
                  step="0.1"
                  className="input"
                  value={form.rating_avg}
                  onChange={(event) => setForm({ ...form, rating_avg: event.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="courierRatingCount">{t("couriers.fields.ratingCount")}</label>
                <input
                  id="courierRatingCount"
                  type="number"
                  className="input"
                  value={form.rating_count}
                  onChange={(event) => setForm({ ...form, rating_count: event.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="button" type="submit">
                {t("common.save")}
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => setEditing(false)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}

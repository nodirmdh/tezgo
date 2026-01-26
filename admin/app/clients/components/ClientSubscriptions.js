"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../../components/LocaleProvider";

const defaultValue = {
  email_opt_in: 0,
  push_opt_in: 0,
  sms_opt_in: 0,
  food_email: 0,
  food_push: 0,
  food_sms: 0,
  market_email: 0,
  market_push: 0,
  market_sms: 0,
  taxi_email: 0,
  taxi_push: 0,
  taxi_sms: 0
};

export default function ClientSubscriptions({ value, saving, onSave }) {
  const { t } = useLocale();
  const [state, setState] = useState({ ...defaultValue, ...(value || {}) });

  useEffect(() => {
    setState({ ...defaultValue, ...(value || {}) });
  }, [value]);

  const toggle = (key) =>
    setState((prev) => ({
      ...prev,
      [key]: prev[key] ? 0 : 1
    }));

  return (
    <section className="card profile-card embedded-card">
      <div className="profile-title">{t("clients.subscriptions.title")}</div>
      <div className="subscriptions-grid">
        <div>
          <div className="helper-text">{t("clients.subscriptions.channels")}</div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.email_opt_in)}
              onChange={() => toggle("email_opt_in")}
            />
            {t("clients.subscriptions.email")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.push_opt_in)}
              onChange={() => toggle("push_opt_in")}
            />
            {t("clients.subscriptions.push")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.sms_opt_in)}
              onChange={() => toggle("sms_opt_in")}
            />
            {t("clients.subscriptions.sms")}
          </label>
        </div>

        <div>
          <div className="helper-text">{t("clients.subscriptions.food")}</div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.food_email)}
              onChange={() => toggle("food_email")}
            />
            {t("clients.subscriptions.email")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.food_push)}
              onChange={() => toggle("food_push")}
            />
            {t("clients.subscriptions.push")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.food_sms)}
              onChange={() => toggle("food_sms")}
            />
            {t("clients.subscriptions.sms")}
          </label>
        </div>

        <div>
          <div className="helper-text">{t("clients.subscriptions.market")}</div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.market_email)}
              onChange={() => toggle("market_email")}
            />
            {t("clients.subscriptions.email")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.market_push)}
              onChange={() => toggle("market_push")}
            />
            {t("clients.subscriptions.push")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.market_sms)}
              onChange={() => toggle("market_sms")}
            />
            {t("clients.subscriptions.sms")}
          </label>
        </div>

        <div>
          <div className="helper-text">{t("clients.subscriptions.taxi")}</div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.taxi_email)}
              onChange={() => toggle("taxi_email")}
            />
            {t("clients.subscriptions.email")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.taxi_push)}
              onChange={() => toggle("taxi_push")}
            />
            {t("clients.subscriptions.push")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.taxi_sms)}
              onChange={() => toggle("taxi_sms")}
            />
            {t("clients.subscriptions.sms")}
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <button className="button" type="button" onClick={() => onSave(state)} disabled={saving}>
          {saving ? t("clients.subscriptions.saving") : t("common.save")}
        </button>
      </div>
    </section>
  );
}

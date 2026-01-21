"use client";

import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function ClientOverview({
  client,
  metrics,
  onEdit,
  onBlockToggle,
  loading,
  primaryAddress,
  lastPromo,
  onManageAddresses,
  onViewPromos
}) {
  const { locale, t } = useLocale();
  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">{t("clients.overview.details")}</div>
        <div className="profile-row">
          <span className="muted">{t("clients.fields.name")}</span>
          <span>{client.name || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("clients.fields.phone")}</span>
          <span>{client.phone || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("clients.fields.status")}</span>
          <span>{translateStatus(locale, client.status || "-")}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("clients.fields.userId")}</span>
          <span>{client.id}</span>
        </div>
        <div className="profile-row">
          <span className="muted">TG ID</span>
          <span>{client.tg_id || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">TG Username</span>
          <span>{client.username || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("clients.fields.createdAt")}</span>
          <span>{formatDate(client.created_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("clients.fields.updatedAt")}</span>
          <span>{formatDate(client.updated_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("clients.fields.lastOrder")}</span>
          <span>{formatDate(metrics.lastOrderAt)}</span>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">{t("clients.overview.metrics")}</div>
        {loading ? (
          <div className="skeleton-block" />
        ) : (
          <div className="cards compact">
            <div className="card">
              <div className="helper-text">{t("clients.metrics.orders")}</div>
              <div className="card-value">{metrics.ordersCount}</div>
            </div>
            <div className="card">
              <div className="helper-text">{t("clients.metrics.totalSpent")}</div>
              <div className="card-value">
                {metrics.totalSpent} {t("currency.sum")}
              </div>
            </div>
            <div className="card">
              <div className="helper-text">{t("clients.metrics.avgCheck")}</div>
              <div className="card-value">
                {metrics.avgCheck} {t("currency.sum")}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card profile-card">
        <div className="profile-title">{t("clients.overview.support")}</div>
        <div className="profile-row">
          <span className="muted">{t("clients.overview.primaryAddress")}</span>
          <span>{primaryAddress?.address_text || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("clients.overview.lastPromo")}</span>
          <span>{lastPromo ? `${lastPromo.code} (${lastPromo.status})` : "-"}</span>
        </div>
        <div className="table-actions">
          <button className="action-link" type="button" onClick={onManageAddresses}>
            {t("clients.overview.manageAddresses")}
          </button>
          <button className="action-link" type="button" onClick={onViewPromos}>
            {t("clients.overview.viewPromos")}
          </button>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">{t("common.actions")}</div>
        <div className="action-grid">
          <button className="button" type="button" onClick={onEdit}>
            {t("common.edit")}
          </button>
          <button className="button" type="button" onClick={onBlockToggle}>
            {client.status === "active" ? t("clients.actions.block") : t("clients.actions.unblock")}
          </button>
        </div>
      </section>
    </div>
  );
}

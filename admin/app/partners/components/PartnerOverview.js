"use client";

import { can } from "../../../lib/rbac";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

export default function PartnerOverview({ partner, role, onBlockToggle }) {
  const { locale, t } = useLocale();
  const canBlock = can("block", role);

  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">{t("partners.overview.title")}</div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.name")}</span>
          <span>{partner.name}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.manager")}</span>
          <span>{partner.manager || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.contactName")}</span>
          <span>{partner.contact_name || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.email")}</span>
          <span>{partner.email || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.phone1")}</span>
          <span>{partner.phone_primary || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.phone2")}</span>
          <span>{partner.phone_secondary || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.phone3")}</span>
          <span>{partner.phone_tertiary || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.outlets")}</span>
          <span>{partner.outlets_count}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.status")}</span>
          <span>{translateStatus(locale, partner.status || "active")}</span>
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
            {partner.status === "blocked"
              ? t("partners.actions.unblock")
              : t("partners.actions.block")}
          </button>
          {!canBlock ? (
            <div className="helper-text">{t("partners.actions.noAccess")}</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

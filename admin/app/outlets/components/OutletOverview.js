"use client";

import { can } from "../../../lib/rbac";
import { useLocale } from "../../components/LocaleProvider";

export default function OutletOverview({ outlet, role, onStatusChange }) {
  const { t } = useLocale();
  const canEdit = can("edit", role);

  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">{t("outlets.overview.title")}</div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.name")}</span>
          <span>{outlet.name}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.partner")}</span>
          <span>{outlet.partner_name || outlet.partner_id || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.type")}</span>
          <span>{outlet.type}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.address")}</span>
          <span>{outlet.address || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.addressComment")}</span>
          <span>{outlet.address_comment || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.phone")}</span>
          <span>{outlet.phone || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.email")}</span>
          <span>{outlet.email || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.status")}</span>
          <span>{t(`outlets.status.${outlet.status || "open"}`, { defaultValue: outlet.status || "open" })}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.statusReason")}</span>
          <span>{outlet.status_reason || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.hours")}</span>
          <span>{outlet.hours || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("outlets.fields.deliveryZone")}</span>
          <span>{outlet.delivery_zone || "-"}</span>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">{t("common.actions")}</div>
        <div className="action-grid">
          <button
            className="button"
            type="button"
            disabled={!canEdit}
            onClick={() => {
              if (outlet.status === "open") {
                const reason = window.prompt(
                  t("outlets.confirm.reasonPlaceholder"),
                  ""
                );
                if (!reason) {
                  return;
                }
                onStatusChange("closed", reason);
                return;
              }
              onStatusChange("open");
            }}
          >
            {outlet.status === "open"
              ? t("outlets.actions.tempDisable")
              : t("outlets.actions.activate")}
          </button>
          <button
            className="button danger"
            type="button"
            disabled={!canEdit}
            onClick={() => onStatusChange("blocked")}
          >
            {t("outlets.actions.block")}
          </button>
          {!canEdit ? (
            <div className="helper-text">{t("outlets.actions.noAccess")}</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

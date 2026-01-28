"use client";

import { useEffect, useState } from "react";
import { can } from "../../../lib/rbac";
import { useLocale } from "../../components/LocaleProvider";

export default function PartnerOverview({
  partner,
  role,
  onBlockToggle,
  onVerify,
  onCommissionUpdate,
  onPayoutHold
}) {
  const { t } = useLocale();
  const [commission, setCommission] = useState(partner.commission_percent ?? 0);
  const [comment, setComment] = useState("");
  const canBlock = can("block", role);
  const canVerify = ["admin", "support"].includes(String(role || ""));
  const canCommission = String(role || "") === "admin";

  useEffect(() => {
    setCommission(partner.commission_percent ?? 0);
    setComment("");
  }, [partner]);

  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">{t("partners.overview.title")}</div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.displayName")}</span>
          <span>{partner.display_name || partner.name || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.legalName")}</span>
          <span>{partner.legal_name || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.legalType")}</span>
          <span>{partner.legal_type || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.inn")}</span>
          <span>{partner.inn || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.director")}</span>
          <span>{partner.director_full_name || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.email")}</span>
          <span>{partner.email || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.phone")}</span>
          <span>{partner.phone || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.legalAddress")}</span>
          <span>{partner.legal_address || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.bank")}</span>
          <span>{partner.bank_name || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.bankAccount")}</span>
          <span>{partner.bank_account || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.bankMfo")}</span>
          <span>{partner.bank_mfo || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">{t("partners.fields.verification")}</span>
          <span>{t(`partners.verification.${partner.verification_status || "draft"}`)}</span>
        </div>
        {partner.verification_comment ? (
          <div className="banner error">{partner.verification_comment}</div>
        ) : null}
      </section>

      <section className="card profile-card">
        <div className="profile-title">{t("partners.actions.title")}</div>
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
          {canVerify ? (
            <>
              <div className="auth-field">
                <label htmlFor="verifyComment">{t("partners.actions.comment")}</label>
                <textarea
                  id="verifyComment"
                  className="input"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={t("partners.actions.commentPlaceholder")}
                />
              </div>
              <div className="table-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => onVerify({ action: "verify" })}
                >
                  {t("partners.actions.verify")}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => onVerify({ action: "reject", comment })}
                  disabled={!comment.trim()}
                >
                  {t("partners.actions.reject")}
                </button>
              </div>
            </>
          ) : (
            <div className="helper-text">{t("partners.actions.noAccess")}</div>
          )}
          <div className="auth-field">
            <label htmlFor="commission">{t("partners.fields.commission")}</label>
            <input
              id="commission"
              className="input"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commission}
              onChange={(event) => setCommission(event.target.value)}
              disabled={!canCommission}
            />
            <button
              className="button"
              type="button"
              onClick={() => onCommissionUpdate(Number(commission))}
              disabled={!canCommission}
            >
              {t("partners.actions.updateCommission")}
            </button>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(partner.payout_hold)}
              onChange={(event) => onPayoutHold(event.target.checked)}
            />
            {t("partners.fields.payoutHold")}
          </label>
        </div>
      </section>
    </div>
  );
}

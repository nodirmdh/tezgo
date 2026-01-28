"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useLocale } from "../components/LocaleProvider";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { changePassword, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await changePassword({ oldPassword, newPassword });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/");
  };

  return (
    <div className="auth-layout">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <div className="auth-title">{t("auth.changeTitle")}</div>
          <div style={{ color: "#64748B", fontSize: "14px" }}>
            {t("auth.changeDescription")}
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="oldPassword">{t("auth.oldPassword")}</label>
          <input
            id="oldPassword"
            className="input"
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="newPassword">{t("auth.newPassword")}</label>
          <input
            id="newPassword"
            className="input"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="button" type="submit" disabled={loading}>
            {loading ? t("auth.loading") : t("auth.savePassword")}
          </button>
          <button className="button secondary" type="button" onClick={logout}>
            {t("auth.logout")}
          </button>
        </div>
      </form>
    </div>
  );
}

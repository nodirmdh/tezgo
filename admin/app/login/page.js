"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "../components/LocaleProvider";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login({ identifier: identifier.trim(), password });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const needsChange = Boolean(result.data?.mustChangePassword);
    router.push(needsChange ? "/change-password" : "/");
  };

  return (
    <div className="auth-layout">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <div className="auth-title">{t("auth.title")}</div>
          <div style={{ color: "#64748B", fontSize: "14px" }}>
            {t("auth.description")}
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="identifier">{t("auth.identifier")}</label>
          <input
            id="identifier"
            className="input"
            placeholder={t("auth.identifierPlaceholder")}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">{t("auth.password")}</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="button" type="submit" disabled={loading}>
          {loading ? t("auth.loading") : t("auth.submit")}
        </button>
      </form>
    </div>
  );
}

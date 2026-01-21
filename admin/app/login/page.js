"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "../components/LocaleProvider";
import { translateRole } from "../../lib/i18n";

const roles = ["admin", "support", "operator", "read-only"];

export default function LoginPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [tgId, setTgId] = useState("");
  const [role, setRole] = useState(roles[0]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedRole = role.toLowerCase();
    localStorage.setItem(
      "adminAuth",
      JSON.stringify({ tgId: tgId.trim(), role: normalizedRole })
    );
    document.cookie = `admin_role=${encodeURIComponent(normalizedRole)}; path=/`;
    document.cookie = `admin_tg=${encodeURIComponent(tgId.trim())}; path=/`;
    router.push("/");
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
          <label htmlFor="tgId">{t("auth.tgId")}</label>
          <input
            id="tgId"
            className="input"
            placeholder={t("auth.tgPlaceholder")}
            value={tgId}
            onChange={(event) => setTgId(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="role">{t("auth.role")}</label>
          <select
            id="role"
            className="select"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {translateRole(locale, item)}
              </option>
            ))}
          </select>
        </div>
        <button className="button" type="submit">
          {t("auth.submit")}
        </button>
      </form>
    </div>
  );
}

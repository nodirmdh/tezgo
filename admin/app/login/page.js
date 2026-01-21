"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const roles = ["admin", "support", "operator", "read-only"];

export default function LoginPage() {
  const router = useRouter();
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
          <div className="auth-title">Вход в админку</div>
          <div style={{ color: "#64748B", fontSize: "14px" }}>
            Укажите Telegram ID и роль доступа.
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="tgId">Telegram ID</label>
          <input
            id="tgId"
            className="input"
            placeholder="Например: 123456789"
            value={tgId}
            onChange={(event) => setTgId(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="role">Роль</label>
          <select
            id="role"
            className="select"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <button className="button" type="submit">
          Войти
        </button>
      </form>
    </div>
  );
}

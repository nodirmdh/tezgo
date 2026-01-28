"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../../lib/api/client";
import { setAccessToken, setAuthUser, setRefreshHandler } from "../../lib/auth";

const AuthContext = createContext(null);

const setAdminCookies = (user) => {
  if (!user) {
    document.cookie = "admin_role=; path=/; max-age=0";
    document.cookie = "admin_tg=; path=/; max-age=0";
    return;
  }
  document.cookie = `admin_role=${encodeURIComponent(user.role || "support")}; path=/`;
  if (user.tg_id) {
    document.cookie = `admin_tg=${encodeURIComponent(user.tg_id)}; path=/`;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const refresh = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) {
        setAccessTokenState(null);
        setAccessToken(null);
        setUser(null);
        setAuthUser(null);
        setAdminCookies(null);
        return null;
      }
      const payload = await response.json();
      if (payload?.accessToken) {
        setAccessTokenState(payload.accessToken);
        setAccessToken(payload.accessToken);
      }
      if (payload?.user) {
        setUser(payload.user);
        setAuthUser(payload.user);
        setAdminCookies(payload.user);
      }
      setMustChangePassword(Boolean(payload?.user?.mustChangePassword));
      return payload;
    } catch {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
      setAuthUser(null);
      setAdminCookies(null);
      return null;
    }
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: payload?.message || payload?.error || "Login failed" };
    }
    if (payload?.accessToken) {
      setAccessTokenState(payload.accessToken);
      setAccessToken(payload.accessToken);
    }
    if (payload?.user) {
      setUser(payload.user);
      setAuthUser(payload.user);
      setAdminCookies(payload.user);
    }
    setMustChangePassword(Boolean(payload?.mustChangePassword));
    return { ok: true, data: payload };
  }, []);

  const logout = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    try {
      await fetch(`${baseUrl}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore logout errors
    }
    setAccessTokenState(null);
    setAccessToken(null);
    setUser(null);
    setAuthUser(null);
    setMustChangePassword(false);
    setAdminCookies(null);
  }, []);

  const changePassword = useCallback(
    async ({ oldPassword, newPassword }) => {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, error: payload?.message || payload?.error || "Change failed" };
      }
      setMustChangePassword(false);
      return { ok: true, data: payload };
    },
    [accessToken]
  );

  useEffect(() => {
    setRefreshHandler(refresh);
    refresh().finally(() => setLoading(false));
    return () => setRefreshHandler(null);
  }, [refresh]);

  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      mustChangePassword,
      login,
      logout,
      refresh,
      changePassword
    }),
    [user, accessToken, loading, mustChangePassword, login, logout, refresh, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

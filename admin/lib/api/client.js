import { apiErrorMessage } from "./errors";
import { getAccessToken, getAuthUser, getRefreshHandler, setAccessToken } from "../auth";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

const decodeRoleFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.role || null;
  } catch {
    return null;
  }
};

export const apiFetch = async (path, options = {}, retry = true) => {
  const baseUrl = getApiBaseUrl();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    const role = decodeRoleFromToken(token);
    if (role) {
      headers["x-role"] = role;
    }
  }
  const user = getAuthUser();
  if (user?.tg_id) {
    headers["x-actor-tg"] = user.tg_id;
  }
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers,
      credentials: "include",
      ...options
    });
    if (response.status === 401 && retry) {
      const refresh = getRefreshHandler();
      if (refresh) {
        const refreshed = await refresh();
        if (refreshed?.accessToken) {
          setAccessToken(refreshed.accessToken);
          return apiFetch(path, options, false);
        }
      }
    }
    return response;
  } catch {
    return new Response(null, { status: 503 });
  }
};

export const apiJson = async (path, options = {}) => {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    let error = apiErrorMessage(response.status);
    try {
      const payload = await response.json();
      if (payload?.message || payload?.error) {
        error = payload.message || payload.error;
      }
    } catch {
      // ignore non-json errors
    }
    return {
      ok: false,
      status: response.status,
      error,
      data: null
    };
  }

  try {
    return { ok: true, status: response.status, error: null, data: await response.json() };
  } catch {
    return { ok: false, status: 500, error: apiErrorMessage(500), data: null };
  }
};

import { getAccessToken, getRefreshHandler, setAccessToken } from "./session";

export const getApiBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

export const apiFetch = async (path, options = {}, retry = true) => {
  const baseUrl = getApiBaseUrl();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include"
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
};

export const apiJson = async (path, options = {}) => {
  const response = await apiFetch(path, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.message || payload?.error || "Request failed",
      data: null
    };
  }
  return { ok: true, status: response.status, error: null, data: payload };
};

import { apiErrorMessage } from "./errors";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export const apiFetch = async (path, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("adminAuth");
    if (stored) {
      const parsed = JSON.parse(stored);
      headers["x-role"] = parsed.role || "support";
      headers["x-actor-tg"] = parsed.tgId || "";
    }
  }
  try {
    return await fetch(`${baseUrl}${path}`, {
      headers,
      ...options
    });
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
      if (payload?.error) {
        error = payload.error;
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

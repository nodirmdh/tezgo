import { cookies } from "next/headers";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.ADMIN_API_BASE_URL ||
  "http://localhost:3002";

export const apiRequest = (path, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const cookieStore = cookies();
  const role = cookieStore.get("admin_role")?.value;
  const tgId = cookieStore.get("admin_tg")?.value;
  const headers = {
    ...(options.headers || {})
  };
  if (role) {
    headers["x-role"] = role;
  }
  if (tgId) {
    headers["x-actor-tg"] = tgId;
  }
  return fetch(`${baseUrl}${path}`, { cache: "no-store", ...options, headers });
};

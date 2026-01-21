import { apiJson } from "./client";

export const searchAll = async (query, signal) => {
  const encoded = encodeURIComponent(query);
  const result = await apiJson(`/api/search?q=${encoded}`, { signal });
  if (!result.ok) {
    return { users: [], clients: [], orders: [] };
  }
  return result.data;
};

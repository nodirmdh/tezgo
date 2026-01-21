import { apiRequest } from "./serverApi";
import { users, orders as mockOrders, financeTransactions } from "./mockData";

const mockUser = (id) => {
  const parsedId = Number(id);
  return (
    users.find((item) => item.id === parsedId) || {
      id: parsedId,
      tg_id: `TG-${parsedId}`,
      username: "@user",
      status: "active",
      role: "client"
    }
  );
};

const mockOrderItems = mockOrders.map((order, index) => ({
  id: order.db_id ?? index + 1,
  order_number: order.order_number ?? order.id,
  status: order.status_raw ?? "accepted_by_restaurant",
  created_at: new Date().toISOString(),
  total_amount: 56000,
  delivery_address: "ул. Навои, 21",
  courier_user_id: order.courier === "-" ? null : 2,
  outlet_name: order.outlet
}));

const mockFinance = () => ({
  role: "client",
  balance: 0,
  summary: [
    { label: "Платежи", value: 0 },
    { label: "Возвраты", value: 0 },
    { label: "Промокоды", value: 0 }
  ],
  transactions: financeTransactions.map((item) => ({
    ...item,
    amount: Number(String(item.amount).replace(/\D/g, "")) || 0,
    created_at: new Date().toISOString()
  }))
});

const normalizeUser = (user) => ({
  id: user?.id ?? null,
  tg_id: user?.tg_id ?? "-",
  username: user?.username ?? "-",
  role: user?.role ?? "client",
  status: user?.status ?? "active",
  created_at: user?.created_at ?? null,
  updated_at: user?.updated_at ?? null,
  last_active: user?.last_active ?? null
});

const normalizeOrders = (payload) => ({
  items: payload?.items ?? [],
  page: payload?.page ?? 1,
  page_size: payload?.page_size ?? 10,
  total: payload?.total ?? 0
});

const normalizeFinance = (payload) => ({
  role: payload?.role ?? "client",
  balance: payload?.balance ?? 0,
  summary: payload?.summary ?? [],
  transactions: payload?.transactions ?? []
});

export const getUserProfile = async (id) => {
  try {
    const response = await apiRequest(`/api/users/${id}`);
    if (!response.ok) {
      return { error: null, user: normalizeUser(mockUser(id)) };
    }
    const user = await response.json();
    return { error: null, user: normalizeUser(user) };
  } catch {
    return { error: null, user: normalizeUser(mockUser(id)) };
  }
};

export const getUserOrders = async (id, query = "") => {
  try {
    const response = await apiRequest(`/api/users/${id}/orders${query}`);
    if (!response.ok) {
      return {
        error: null,
        data: normalizeOrders({
          items: mockOrderItems,
          page: 1,
          page_size: 10,
          total: mockOrderItems.length
        })
      };
    }
    const payload = await response.json();
    return { error: null, data: normalizeOrders(payload) };
  } catch {
    return {
      error: null,
      data: normalizeOrders({
        items: mockOrderItems,
        page: 1,
        page_size: 10,
        total: mockOrderItems.length
      })
    };
  }
};

export const getUserFinance = async (id) => {
  try {
    const response = await apiRequest(`/api/users/${id}/finance`);
    if (!response.ok) {
      return { error: null, data: mockFinance() };
    }
    const payload = await response.json();
    return { error: null, data: normalizeFinance(payload) };
  } catch {
    return { error: null, data: mockFinance() };
  }
};

export const getUserActivity = async (id) => {
  try {
    const response = await apiRequest(`/api/users/${id}/activity`);
    if (!response.ok) {
      return { error: null, data: [] };
    }
    return { error: null, data: await response.json() };
  } catch {
    return { error: null, data: [] };
  }
};

export const getUserAudit = async (id) => {
  try {
    const response = await apiRequest(`/api/users/${id}/audit`);
    if (!response.ok) {
      return { error: null, data: [] };
    }
    return { error: null, data: await response.json() };
  } catch {
    return { error: null, data: [] };
  }
};

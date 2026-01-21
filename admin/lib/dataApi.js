import {
  clients,
  couriers as mockCouriers,
  dashboardCards,
  financeSummary,
  financeTransactions,
  orders as mockOrders,
  outlets as mockOutlets,
  partners as mockPartners,
  recentOrders,
  users as mockUsers
} from "./mockData";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.ADMIN_API_BASE_URL;

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const statusLabels = {
  accepted_by_system: "Принят системой",
  accepted_by_restaurant: "Принят рестораном",
  ready_for_pickup: "Готов к выдаче",
  picked_up: "Курьер забрал",
  delivered: "Доставил"
};

const formatStatus = (status) => statusLabels[status] ?? status ?? "-";

const safeFetch = async (path) => {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
};

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

const formatOrderId = (order) =>
  order.order_number || `ORD-${String(order.id).padStart(4, "0")}`;

const toUser = (user) => ({
  id: user.id,
  tg_id: user.tg_id || "-",
  username: user.username || "-",
  status: user.status || "active",
  role: user.role || "client"
});

const toCourier = (courier) => ({
  user_id: courier.user_id,
  name: `Courier #${courier.user_id}`,
  rating: courier.rating_avg ?? 0,
  status: courier.is_active ? "active" : "paused"
});

const toPartner = (partner, partnerOutletsCount) => ({
  id: partner.id,
  name: partner.name ?? "-",
  outlets: partnerOutletsCount ?? 0,
  manager: partner.manager ?? "-"
});

const toOutlet = (outlet) => ({
  id: outlet.id,
  name: outlet.name ?? "-",
  type: outlet.type ?? "-",
  address: outlet.address ?? "-"
});

const toOrder = (order, outletName, courierName) => ({
  id: formatOrderId(order),
  db_id: order.id,
  order_number: order.order_number,
  outlet: outletName ?? "-",
  courier: courierName ?? "-",
  status: formatStatus(order.status),
  status_raw: order.status,
  pickup_code_plain: order.pickup_code_plain ?? null
});

export async function getDashboardSummary() {
  const [users, orders, couriers, outlets] = await Promise.all([
    safeFetch("/api/users"),
    safeFetch("/api/orders"),
    safeFetch("/api/couriers"),
    safeFetch("/api/outlets")
  ]);

  if (!users || !orders || !couriers || !outlets) {
    await delay();
    return { cards: dashboardCards, recentOrders };
  }

  const outletById = new Map(outlets.map((item) => [item.id, item.name]));
  const recent = orders.slice(-5).reverse().map((order) =>
    toOrder(
      order,
      outletById.get(order.outlet_id),
      order.courier_user_id ? `Courier #${order.courier_user_id}` : "-"
    )
  );

  const cards = [
    { title: "Заказы сегодня", value: String(orders.length) },
    {
      title: "Активные курьеры",
      value: String(couriers.filter((courier) => courier.is_active).length)
    },
    { title: "Новые клиенты", value: String(users.length) },
    { title: "Сервисный сбор", value: "—" }
  ];

  return { cards, recentOrders: recent };
}

export async function getUsers(filters) {
  const users = await safeFetch(`/api/users${buildQuery(filters)}`);
  if (!users) {
    await delay();
    return mockUsers;
  }
  return users.map(toUser);
}

export async function getClients() {
  await delay();
  return clients;
}

export async function getPartners(filters) {
  const [partners, outlets] = await Promise.all([
    safeFetch(`/api/partners${buildQuery(filters)}`),
    safeFetch("/api/outlets")
  ]);

  if (!partners || !outlets) {
    await delay();
    return mockPartners;
  }

  const countByPartner = outlets.reduce((acc, outlet) => {
    acc[outlet.partner_id] = (acc[outlet.partner_id] || 0) + 1;
    return acc;
  }, {});

  return partners.map((partner) =>
    toPartner(partner, countByPartner[partner.id])
  );
}

export async function getOutlets(filters) {
  const outlets = await safeFetch(`/api/outlets${buildQuery(filters)}`);
  if (!outlets) {
    await delay();
    return mockOutlets;
  }
  return outlets.map(toOutlet);
}

export async function getCouriers(filters) {
  const couriers = await safeFetch(`/api/couriers${buildQuery(filters)}`);
  if (!couriers) {
    await delay();
    return mockCouriers;
  }
  return couriers.map(toCourier);
}

export async function getOrders(filters) {
  const [orders, outlets] = await Promise.all([
    safeFetch(`/api/orders${buildQuery(filters)}`),
    safeFetch("/api/outlets")
  ]);

  if (!orders || !outlets) {
    await delay();
    return mockOrders;
  }

  const outletById = new Map(outlets.map((item) => [item.id, item.name]));
  return orders.map((order) =>
    toOrder(
      order,
      outletById.get(order.outlet_id),
      order.courier_user_id ? `Courier #${order.courier_user_id}` : "-"
    )
  );
}

export async function getFinance(filters) {
  const [summary, ledger] = await Promise.all([
    safeFetch("/api/finance/summary"),
    safeFetch(`/api/finance/ledger${buildQuery(filters)}`)
  ]);

  if (!summary || !ledger) {
    await delay();
    return { summary: financeSummary, transactions: financeTransactions };
  }

  const summaryView = summary.map((item) => ({
    type: item.type,
    amount: `${item.amount} сум`
  }));

  const transactions = ledger.map((item) => ({
    id: item.id,
    title: item.title,
    amount: `${item.amount} сум`,
    status: item.status
  }));

  return { summary: summaryView, transactions };
}

export async function getPromos(filters) {
  const promos = await safeFetch(`/api/promos${buildQuery(filters)}`);
  if (!promos) {
    await delay();
    return [];
  }
  return promos;
}

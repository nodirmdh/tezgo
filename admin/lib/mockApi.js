import {
  clients,
  couriers,
  dashboardCards,
  financeSummary,
  financeTransactions,
  orders,
  outlets,
  partners,
  recentOrders,
  users
} from "./mockData";

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getDashboardSummary() {
  await delay();
  return { cards: dashboardCards, recentOrders };
}

export async function getUsers() {
  await delay();
  return users;
}

export async function getClients() {
  await delay();
  return clients;
}

export async function getPartners() {
  await delay();
  return partners;
}

export async function getOutlets() {
  await delay();
  return outlets;
}

export async function getCouriers() {
  await delay();
  return couriers;
}

export async function getOrders() {
  await delay();
  return orders;
}

export async function getFinance() {
  await delay();
  return { summary: financeSummary, transactions: financeTransactions };
}

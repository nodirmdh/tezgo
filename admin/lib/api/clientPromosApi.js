import { apiJson } from "./client";

export const getClientPromos = (clientId) =>
  apiJson(`/api/clients/${clientId}/promos`);

export const issueClientPromo = (clientId, payload) =>
  apiJson(`/api/clients/${clientId}/promos/issue`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const revokeClientPromo = (clientId, promoIssueId, payload = {}) =>
  apiJson(`/api/clients/${clientId}/promos/${promoIssueId}/revoke`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

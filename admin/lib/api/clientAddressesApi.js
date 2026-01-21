import { apiJson } from "./client";

export const getClientAddresses = (clientId) =>
  apiJson(`/api/clients/${clientId}/addresses`);

export const createClientAddress = (clientId, payload) =>
  apiJson(`/api/clients/${clientId}/addresses`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateClientAddress = (clientId, addressId, payload) =>
  apiJson(`/api/clients/${clientId}/addresses/${addressId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const deleteClientAddress = (clientId, addressId) =>
  apiJson(`/api/clients/${clientId}/addresses/${addressId}`, {
    method: "DELETE"
  });

export const setPrimaryClientAddress = (clientId, addressId) =>
  apiJson(`/api/clients/${clientId}/addresses/${addressId}/set-primary`, {
    method: "POST"
  });

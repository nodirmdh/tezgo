import { apiJson } from "./client";

export const bulkUpdateOutletItems = ({ outletId, action, itemIds, params, reason }) =>
  apiJson(`/api/outlets/${outletId}/items/bulk`, {
    method: "POST",
    body: JSON.stringify({ action, itemIds, params, reason })
  });

export const bulkUpdateCampaignItems = ({
  outletId,
  campaignId,
  action,
  itemIds,
  params,
  reason
}) =>
  apiJson(`/api/outlets/${outletId}/campaigns/${campaignId}/items/bulk`, {
    method: "POST",
    body: JSON.stringify({ action, itemIds, params, reason })
  });

import { apiJson } from "./client";

export const uploadCsvPreview = ({ type, csvText, contextOutletId, contextCampaignId }) =>
  apiJson("/api/bulk/upload", {
    method: "POST",
    body: JSON.stringify({ type, csvText, contextOutletId, contextCampaignId })
  });

export const applyCsvPreview = ({ previewId, reason }) =>
  apiJson("/api/bulk/apply", {
    method: "POST",
    body: JSON.stringify({ previewId, reason })
  });

import { parseCsv } from "../services/csvParser.js";
import {
  buildPreview,
  createPreview,
  getPreview,
  markPreviewApplied,
  pruneExpiredPreviews
} from "../services/bulkPreviewService.js";
import { applyPreviewChanges } from "../services/bulkApplyService.js";

const MAX_UPLOAD_ROWS = 1000;

const isMenuUploadType = (type) => ["menuPricesAvailability", "menuStock"].includes(type);

export const registerBulkUploadRoutes = ({
  app,
  db,
  getRole,
  getActorId,
  logAudit,
  nowIso
}) => {
  app.post("/api/bulk/upload", (req, res) => {
    pruneExpiredPreviews();
    const { type, csvText, contextOutletId, contextCampaignId } = req.body || {};
    if (!type) {
      return res.status(400).json({ error: "type required" });
    }
    if (!csvText) {
      return res.status(400).json({ error: "csvText required" });
    }

    const role = getRole(req);
    if (type === "menuPricesAvailability" && role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (type === "menuStock" && !["admin", "operator"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (type === "campaignDiscounts" && !["admin", "operator"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!["menuPricesAvailability", "menuStock", "campaignDiscounts"].includes(type)) {
      return res.status(400).json({ error: "Unsupported type" });
    }

    const parsed = parseCsv(csvText);
    if (parsed.headers.length === 0) {
      return res.status(400).json({ error: "CSV headers required" });
    }
    if (parsed.rows.length > MAX_UPLOAD_ROWS) {
      return res.status(400).json({ error: `Too many rows (max ${MAX_UPLOAD_ROWS})` });
    }

    let requiredHeaders = [];
    if (type === "campaignDiscounts") {
      requiredHeaders = ["outlet_id", "campaign_id", "item_id", "discount_type", "discount_value"];
    } else if (type === "menuStock") {
      requiredHeaders = ["outlet_id", "item_id", "stock"];
    } else {
      requiredHeaders = ["outlet_id", "item_id", "base_price", "is_available"];
    }
    const missing = requiredHeaders.filter((header) => !parsed.headers.includes(header));
    if (missing.length && isMenuUploadType(type)) {
      const allowsSku = parsed.headers.includes("sku");
      if (!allowsSku || !missing.includes("item_id")) {
        return res.status(400).json({ error: `Missing columns: ${missing.join(", ")}` });
      }
    } else if (missing.length) {
      return res.status(400).json({ error: `Missing columns: ${missing.join(", ")}` });
    }

    const preview = buildPreview({
      db,
      type,
      rows: parsed.rows,
      contextOutletId: contextOutletId ? Number(contextOutletId) : null,
      contextCampaignId: contextCampaignId ? Number(contextCampaignId) : null
    });

    const previewId = createPreview({
      type,
      rows: preview.rows,
      summary: preview.summary,
      actorId: getActorId(req)
    });

    return res.json({
      previewId,
      rows: preview.rows,
      summary: preview.summary
    });
  });

  app.post("/api/bulk/apply", (req, res) => {
    pruneExpiredPreviews();
    const { previewId, reason } = req.body || {};
    if (!previewId) {
      return res.status(400).json({ error: "previewId required" });
    }
    if (!reason) {
      return res.status(400).json({ error: "reason required" });
    }

    const preview = getPreview(previewId);
    if (!preview) {
      return res.status(404).json({ error: "Preview expired or not found" });
    }
    if (preview.appliedAt) {
      return res.status(400).json({ error: "Preview already applied" });
    }
    if (preview.summary.errors > 0) {
      return res.status(400).json({ error: "Preview contains errors" });
    }

    const role = getRole(req);
    if (preview.type === "menuPricesAvailability" && role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (preview.type === "menuStock" && !["admin", "operator"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (preview.type === "campaignDiscounts" && !["admin", "operator"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = applyPreviewChanges({
      db,
      preview,
      reason: String(reason).trim(),
      actorId: getActorId(req),
      nowIso,
      logAudit
    });
    markPreviewApplied(previewId);
    return res.json(result);
  });
};

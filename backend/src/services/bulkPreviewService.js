import crypto from "crypto";

const PREVIEW_TTL_MS = 20 * 60 * 1000;
const previewStore = new Map();

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const normalizeBoolean = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
};

const compareValues = (oldValue, newValue) => {
  if (oldValue === null || oldValue === undefined) {
    return newValue === null || newValue === undefined;
  }
  return String(oldValue) === String(newValue);
};

const buildValueSummary = (values) => {
  if (!values) return "-";
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${value ?? "-"}`)
    .join(", ");
};

const ensureOutlet = (db, outletId, cache) => {
  if (cache.has(outletId)) return cache.get(outletId);
  const outlet = db.prepare("SELECT id FROM outlets WHERE id = ?").get(outletId);
  const exists = Boolean(outlet);
  cache.set(outletId, exists);
  return exists;
};

const findOutletItem = (db, outletId, itemId, sku, cache) => {
  const key = itemId ? `${outletId}:id:${itemId}` : `${outletId}:sku:${sku}`;
  if (cache.has(key)) return cache.get(key);
  let row = null;
  if (itemId) {
    row = db
      .prepare(
        `SELECT outlet_items.item_id,
                outlet_items.base_price,
                outlet_items.is_available,
                outlet_items.stock,
                items.title,
                items.sku
         FROM outlet_items
         JOIN items ON items.id = outlet_items.item_id
         WHERE outlet_items.outlet_id = ? AND outlet_items.item_id = ?`
      )
      .get(outletId, itemId);
  } else if (sku) {
    row = db
      .prepare(
        `SELECT outlet_items.item_id,
                outlet_items.base_price,
                outlet_items.is_available,
                outlet_items.stock,
                items.title,
                items.sku
         FROM outlet_items
         JOIN items ON items.id = outlet_items.item_id
         WHERE outlet_items.outlet_id = ? AND items.sku = ?`
      )
      .get(outletId, sku);
  }
  cache.set(key, row || null);
  return row || null;
};

const findCampaign = (db, outletId, campaignId, cache) => {
  const key = `${outletId}:${campaignId}`;
  if (cache.has(key)) return cache.get(key);
  const row = db
    .prepare("SELECT id FROM outlet_campaigns WHERE id = ? AND outlet_id = ?")
    .get(campaignId, outletId);
  const exists = Boolean(row);
  cache.set(key, exists);
  return exists;
};

const findCampaignItem = (db, campaignId, itemId, cache) => {
  const key = `${campaignId}:${itemId}`;
  if (cache.has(key)) return cache.get(key);
  const row = db
    .prepare(
      `SELECT discount_type, discount_value
       FROM outlet_campaign_items
       WHERE campaign_id = ? AND item_id = ?`
    )
    .get(campaignId, itemId);
  cache.set(key, row || null);
  return row || null;
};

export const buildPreview = ({
  db,
  type,
  rows,
  contextOutletId = null,
  contextCampaignId = null
}) => {
  const previewRows = [];
  let okCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  const outletCache = new Map();
  const outletItemCache = new Map();
  const campaignCache = new Map();
  const campaignItemCache = new Map();

  rows.forEach(({ rowNumber, data }) => {
    let status = "OK";
    let message = null;
    const outletId = Number(data.outlet_id || data.outletid || "");
    if (!outletId) {
      status = "ERROR";
      message = "outlet_id is required";
    }

    if (status !== "ERROR" && contextOutletId && Number(contextOutletId) !== outletId) {
      status = "ERROR";
      message = `outlet_id must be ${contextOutletId}`;
    }

    const itemIdValue = data.item_id || data.itemid || "";
    const itemId = itemIdValue ? Number(itemIdValue) : null;
    const sku = data.sku || "";

    if (status !== "ERROR" && !ensureOutlet(db, outletId, outletCache)) {
      status = "ERROR";
      message = "Outlet not found";
    }

    if (status !== "ERROR" && !itemId && !sku && type !== "campaignDiscounts") {
      status = "ERROR";
      message = "item_id or sku is required";
    }

    let outletItem = null;
    if (status !== "ERROR" && (itemId || sku)) {
      outletItem = findOutletItem(db, outletId, itemId, sku, outletItemCache);
      if (!outletItem) {
        status = "ERROR";
        message = "Item not found in outlet";
      }
    }

    if (type === "campaignDiscounts" && status !== "ERROR") {
      const campaignId = Number(data.campaign_id || data.campaignid || "");
      if (!campaignId) {
        status = "ERROR";
        message = "campaign_id is required";
      }
      if (status !== "ERROR" && contextCampaignId && Number(contextCampaignId) !== campaignId) {
        status = "ERROR";
        message = `campaign_id must be ${contextCampaignId}`;
      }
      if (status !== "ERROR" && !findCampaign(db, outletId, campaignId, campaignCache)) {
        status = "ERROR";
        message = "Campaign not found";
      }
      if (status !== "ERROR" && !itemId) {
        status = "ERROR";
        message = "item_id is required";
      }
      if (status !== "ERROR" && !outletItem) {
        outletItem = findOutletItem(db, outletId, itemId, null, outletItemCache);
        if (!outletItem) {
          status = "ERROR";
          message = "Item not found in outlet";
        }
      }

      const discountType = data.discount_type;
      const discountValue = normalizeNumber(data.discount_value);
      if (status !== "ERROR" && !["percent", "fixed", "new_price"].includes(discountType)) {
        status = "ERROR";
        message = "Invalid discount_type";
      }
      if (status !== "ERROR" && (discountValue === null || discountValue < 0)) {
        status = "ERROR";
        message = "Invalid discount_value";
      }

      const oldDiscount =
        status === "ERROR" ? null : findCampaignItem(db, campaignId, itemId, campaignItemCache);

      const oldValues = oldDiscount
        ? { discount_type: oldDiscount.discount_type, discount_value: oldDiscount.discount_value }
        : null;
      const newValues = status === "ERROR" ? null : {
        discount_type: discountType,
        discount_value: discountValue
      };

      if (status === "OK" && oldValues) {
        const unchanged =
          compareValues(oldValues.discount_type, newValues.discount_type) &&
          compareValues(oldValues.discount_value, newValues.discount_value);
        if (unchanged) {
          status = "WARNING";
          message = "Discount unchanged";
        }
      }

      previewRows.push({
        rowNumber,
        outletId,
        itemId,
        campaignId,
        itemLabel: outletItem?.title || `Item ${itemId}`,
        old: oldValues,
        new: newValues,
        oldSummary: buildValueSummary(oldValues),
        newSummary: buildValueSummary(newValues),
        status,
        message
      });

      if (status === "OK") okCount += 1;
      if (status === "WARNING") warningCount += 1;
      if (status === "ERROR") errorCount += 1;
      return;
    }

    if (type === "menuPricesAvailability" && status !== "ERROR") {
      const basePrice = normalizeNumber(data.base_price);
      const isAvailable = normalizeBoolean(data.is_available);
      const stockColumnPresent = Object.prototype.hasOwnProperty.call(data, "stock");
      const stockValue = stockColumnPresent ? normalizeNumber(data.stock) : outletItem?.stock ?? null;

      if (basePrice === null || basePrice < 0) {
        status = "ERROR";
        message = "Invalid base_price";
      }
      if (status !== "ERROR" && isAvailable === null) {
        status = "ERROR";
        message = "Invalid is_available";
      }

      const oldValues = outletItem
        ? {
            base_price: outletItem.base_price,
            is_available: Boolean(outletItem.is_available),
            stock: outletItem.stock ?? null
          }
        : null;
      const newValues = status === "ERROR" ? null : {
        base_price: Math.max(0, Math.round(basePrice ?? 0)),
        is_available: Boolean(isAvailable),
        stock: stockColumnPresent ? stockValue : outletItem?.stock ?? null
      };

      if (status === "OK" && oldValues) {
        const unchanged =
          compareValues(oldValues.base_price, newValues.base_price) &&
          compareValues(oldValues.is_available, newValues.is_available) &&
          compareValues(oldValues.stock, newValues.stock);
        if (unchanged) {
          status = "WARNING";
          message = "No changes";
        }
      }

      previewRows.push({
        rowNumber,
        outletId,
        itemId: outletItem?.item_id ?? itemId,
        itemLabel: outletItem?.title || `Item ${itemId || sku}`,
        old: oldValues,
        new: newValues,
        oldSummary: buildValueSummary(oldValues),
        newSummary: buildValueSummary(newValues),
        status,
        message
      });

      if (status === "OK") okCount += 1;
      if (status === "WARNING") warningCount += 1;
      if (status === "ERROR") errorCount += 1;
      return;
    }

    if (type === "menuStock" && status !== "ERROR") {
      const stockValue = normalizeNumber(data.stock);
      if (stockValue !== null && stockValue < 0) {
        status = "ERROR";
        message = "Invalid stock";
      }

      const oldValues = outletItem
        ? {
            stock: outletItem.stock ?? null
          }
        : null;
      const newValues = status === "ERROR" ? null : {
        stock: stockValue
      };

      if (status === "OK" && oldValues) {
        const unchanged = compareValues(oldValues.stock, newValues.stock);
        if (unchanged) {
          status = "WARNING";
          message = "Stock unchanged";
        }
      }

      previewRows.push({
        rowNumber,
        outletId,
        itemId: outletItem?.item_id ?? itemId,
        itemLabel: outletItem?.title || `Item ${itemId || sku}`,
        old: oldValues,
        new: newValues,
        oldSummary: buildValueSummary(oldValues),
        newSummary: buildValueSummary(newValues),
        status,
        message
      });

      if (status === "OK") okCount += 1;
      if (status === "WARNING") warningCount += 1;
      if (status === "ERROR") errorCount += 1;
      return;
    }

    previewRows.push({
      rowNumber,
      outletId,
      itemId,
      itemLabel: outletItem?.title || `Row ${rowNumber}`,
      old: null,
      new: null,
      oldSummary: "-",
      newSummary: "-",
      status: "ERROR",
      message: "Unsupported upload type"
    });
    errorCount += 1;
  });

  return {
    rows: previewRows,
    summary: {
      total: previewRows.length,
      valid: okCount,
      warnings: warningCount,
      errors: errorCount
    }
  };
};

export const createPreview = ({ type, rows, summary, actorId }) => {
  const previewId = crypto.randomUUID();
  const now = Date.now();
  previewStore.set(previewId, {
    id: previewId,
    type,
    rows,
    summary,
    actorId,
    createdAt: now,
    expiresAt: now + PREVIEW_TTL_MS,
    appliedAt: null
  });
  return previewId;
};

export const getPreview = (previewId) => {
  const preview = previewStore.get(previewId);
  if (!preview) return null;
  if (preview.expiresAt <= Date.now()) {
    previewStore.delete(previewId);
    return null;
  }
  return preview;
};

export const markPreviewApplied = (previewId) => {
  const preview = previewStore.get(previewId);
  if (!preview) return null;
  preview.appliedAt = Date.now();
  return preview;
};

export const pruneExpiredPreviews = () => {
  const now = Date.now();
  for (const [id, preview] of previewStore.entries()) {
    if (preview.expiresAt <= now) {
      previewStore.delete(id);
    }
  }
};

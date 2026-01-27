import crypto from "crypto";
import express from "express";
import { initDb } from "./db.js";
import { setupCampaignRoutes } from "./campaignRoutes.js";

const app = express();
const port = process.env.PORT || 3001;
const db = initDb();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-role, x-actor-tg"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

const getRole = (req) =>
  String(req.header("x-role") || "support").toLowerCase();

const getActorTg = (req) => String(req.header("x-actor-tg") || "");

const requireRole = (allowed) => (req, res, next) => {
  const role = getRole(req);
  if (!allowed.includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
};

const generatePickupCode = () =>
  String(Math.floor(100 + Math.random() * 900));

const hashCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const nowIso = () => new Date().toISOString();

const toOrderNumber = (orderNumber) =>
  orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

const generatePromoCode = () =>
  `ND-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const computeCurrentPrice = (basePrice, campaign) => {
  if (!campaign) {
    return basePrice;
  }
  const value = Number(campaign.discount_value || 0);
  if (campaign.discount_type === "percent") {
    return Math.max(0, Math.round(basePrice * (100 - value) / 100));
  }
  if (campaign.discount_type === "fixed") {
    return Math.max(0, basePrice - value);
  }
  if (campaign.discount_type === "new_price") {
    return Math.max(0, value);
  }
  return basePrice;
};

const timeToMinutes = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const isCampaignActiveBySchedule = (campaign, now = new Date()) => {
  const activeDays = parseJsonSafe(campaign.active_days, []);
  if (Array.isArray(activeDays) && activeDays.length) {
    const dayIndex = now.getDay(); // 0 Sunday
    const dayCodes = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayCodes[dayIndex];
    if (!activeDays.includes(today)) {
      return false;
    }
  }

  const hours = parseJsonSafe(campaign.active_hours, null);
  if (hours && typeof hours === "object") {
    const fromMinutes = timeToMinutes(hours.from);
    const toMinutes = timeToMinutes(hours.to);
    if (fromMinutes !== null && toMinutes !== null) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (fromMinutes <= toMinutes) {
        if (currentMinutes < fromMinutes || currentMinutes > toMinutes) {
          return false;
        }
      } else {
        if (currentMinutes < fromMinutes && currentMinutes > toMinutes) {
          return false;
        }
      }
    }
  }

  return true;
};

const getActiveCampaigns = (outletId) => {
  db.prepare(
    `UPDATE campaigns
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE outlet_id = ?
       AND status != 'archived'
       AND end_at IS NOT NULL
       AND end_at < datetime('now')`
  ).run(outletId);

  const rows = db
    .prepare(
      `SELECT campaigns.id,
              campaigns.type,
              campaigns.title,
              campaigns.status,
              campaigns.priority,
              campaigns.start_at,
              campaigns.end_at,
              campaigns.active_days,
              campaigns.active_hours,
              campaigns.min_order_amount,
              campaigns.max_uses_total,
              campaigns.max_uses_per_client,
              campaigns.delivery_methods,
              campaigns.stoplist_policy,
              campaigns.bundle_fixed_price,
              campaigns.bundle_percent_discount,
              campaign_items.item_id,
              campaign_items.qty,
              campaign_items.required,
              campaign_items.discount_type,
              campaign_items.discount_value
       FROM campaigns
       LEFT JOIN campaign_items ON campaign_items.campaign_id = campaigns.id
       WHERE campaigns.outlet_id = ?
         AND campaigns.status = 'active'
         AND (campaigns.start_at IS NULL OR campaigns.start_at <= datetime('now'))
         AND (campaigns.end_at IS NULL OR campaigns.end_at >= datetime('now'))
       ORDER BY campaigns.priority DESC, campaigns.created_at DESC`
    )
    .all(outletId);

  const grouped = new Map();
  rows.forEach((row) => {
    if (!grouped.has(row.id)) {
      grouped.set(row.id, {
        id: row.id,
        type: row.type,
        title: row.title,
        status: row.status,
        priority: row.priority,
        start_at: row.start_at,
        end_at: row.end_at,
        active_days: row.active_days,
        active_hours: row.active_hours,
        min_order_amount: row.min_order_amount,
        max_uses_total: row.max_uses_total,
        max_uses_per_client: row.max_uses_per_client,
        delivery_methods: row.delivery_methods,
        stoplist_policy: row.stoplist_policy,
        bundle_fixed_price: row.bundle_fixed_price,
        bundle_percent_discount: row.bundle_percent_discount,
        items: []
      });
    }
    if (row.item_id) {
      grouped.get(row.id).items.push({
        item_id: row.item_id,
        qty: row.qty,
        required: row.required,
        discount_type: row.discount_type,
        discount_value: row.discount_value
      });
    }
  });

  const now = new Date();
  return Array.from(grouped.values()).filter((campaign) =>
    isCampaignActiveBySchedule(campaign, now)
  );
};

const getPromoDiscount = ({ code, outletId, clientUserId, subtotal }) => {
  if (!code) {
    return { discount: 0, source: null };
  }
  const normalized = String(code).trim();
  if (!normalized) {
    return { discount: 0, source: null };
  }

  if (clientUserId) {
    const promoIssue = db
      .prepare(
        `SELECT id, code, type, value, min_order_amount, status, expires_at
         FROM promo_issues
         WHERE code = ? AND client_user_id = ? AND status = 'active'
           AND (expires_at IS NULL OR expires_at >= datetime('now'))`
      )
      .get(normalized, clientUserId);
    if (promoIssue && (!promoIssue.min_order_amount || subtotal >= promoIssue.min_order_amount)) {
      const value = Number(promoIssue.value || 0);
      if (promoIssue.type === "percent") {
        return {
          discount: Math.max(0, Math.round((subtotal * value) / 100)),
          source: { type: "issue", id: promoIssue.id }
        };
      }
      return {
        discount: Math.max(0, Math.round(Math.min(subtotal, value))),
        source: { type: "issue", id: promoIssue.id }
      };
    }
  }

  const promo = db
    .prepare(
      `SELECT promo_codes.id,
              promo_codes.code,
              promo_codes.discount_percent,
              promo_codes.max_uses,
              promo_codes.used_count,
              promo_codes.is_active,
              promo_codes.starts_at,
              promo_codes.ends_at,
              promo_codes.min_order_amount,
              promo_codes.outlet_id,
              promo_codes.first_order_only,
              GROUP_CONCAT(promo_outlets.outlet_id) as outlet_ids
       FROM promo_codes
       LEFT JOIN promo_outlets ON promo_outlets.promo_code_id = promo_codes.id
       WHERE promo_codes.code = ?
         AND promo_codes.is_active = 1
         AND (promo_codes.starts_at IS NULL OR promo_codes.starts_at <= datetime('now'))
         AND (promo_codes.ends_at IS NULL OR promo_codes.ends_at >= datetime('now'))
       GROUP BY promo_codes.id`
    )
    .get(normalized);
  if (!promo) {
    return { discount: 0, source: null };
  }
  if (promo.min_order_amount && subtotal < promo.min_order_amount) {
    return { discount: 0, source: null };
  }
  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    return { discount: 0, source: null };
  }
  const outletIds = promo.outlet_ids
    ? String(promo.outlet_ids)
        .split(",")
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value))
    : promo.outlet_id
      ? [promo.outlet_id]
      : [];
  if (outletIds.length && outletId && !outletIds.includes(outletId)) {
    return { discount: 0, source: null };
  }
  if (promo.first_order_only && clientUserId) {
    const count = db
      .prepare("SELECT COUNT(*) as count FROM orders WHERE client_user_id = ?")
      .get(clientUserId).count;
    if (count > 1) {
      return { discount: 0, source: null };
    }
  }
  const discountPercent = Number(promo.discount_percent || 0);
  return {
    discount: Math.max(0, Math.round((subtotal * discountPercent) / 100)),
    source: { type: "global", id: promo.id }
  };
};

const computeOrderPricing = ({ order, items }) => {
  const subtotalFood = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  const campaigns = getActiveCampaigns(order.outlet_id);
  const countCampaignUsageStmt = db.prepare(
    "SELECT COUNT(*) as count FROM campaign_usage WHERE campaign_id = ?"
  );
  const countCampaignUsageByClientStmt = db.prepare(
    "SELECT COUNT(*) as count FROM campaign_usage WHERE campaign_id = ? AND client_user_id = ?"
  );
  const campaignDiscounts = new Map();
  let campaignDiscount = 0;

  const itemsById = new Map();
  items.forEach((item) => {
    if (item.item_id) {
      itemsById.set(item.item_id, item);
    }
  });

  const bestItemDiscount = new Map();

  campaigns.forEach((campaign) => {
    if (campaign.min_order_amount && subtotalFood < Number(campaign.min_order_amount || 0)) {
      return;
    }
    if (campaign.max_uses_total && Number(campaign.max_uses_total || 0) > 0) {
      const totalUsed = countCampaignUsageStmt.get(campaign.id).count;
      if (totalUsed >= Number(campaign.max_uses_total || 0)) {
        return;
      }
    }
    if (
      campaign.max_uses_per_client &&
      Number(campaign.max_uses_per_client || 0) > 0 &&
      order.client_user_id
    ) {
      const usedByClient = countCampaignUsageByClientStmt.get(
        campaign.id,
        order.client_user_id
      ).count;
      if (usedByClient >= Number(campaign.max_uses_per_client || 0)) {
        return;
      }
    }
    if (campaign.type === "bundle") {
      const requiredItems = campaign.items.filter((entry) => Number(entry.required) === 1);
      if (!requiredItems.length) {
        return;
      }
      const hasAll = requiredItems.every((entry) => {
        const orderItem = itemsById.get(entry.item_id);
        return orderItem && Number(orderItem.quantity || 0) >= Number(entry.qty || 1);
      });
      if (!hasAll) {
        return;
      }
      const bundleSum = requiredItems.reduce((sum, entry) => {
        const orderItem = itemsById.get(entry.item_id);
        const qty = Number(entry.qty || 1);
        return sum + Number(orderItem.unit_price || 0) * qty;
      }, 0);
      let discount = 0;
      if (campaign.bundle_fixed_price) {
        const fixed = Number(campaign.bundle_fixed_price || 0);
        discount = Math.max(0, bundleSum - fixed);
      } else if (campaign.bundle_percent_discount) {
        const percent = Number(campaign.bundle_percent_discount || 0);
        discount = Math.max(0, Math.round((bundleSum * percent) / 100));
      }
      if (discount > 0) {
        campaignDiscounts.set(campaign.id, (campaignDiscounts.get(campaign.id) || 0) + discount);
        campaignDiscount += discount;
      }
      return;
    }

    if (campaign.type !== "discount") {
      return;
    }

    campaign.items.forEach((entry) => {
      const orderItem = itemsById.get(entry.item_id);
      if (!orderItem) {
        return;
      }
      const requiredQty = Number(entry.qty || 1);
      const orderQty = Number(orderItem.quantity || 0);
      if (orderQty < requiredQty) {
        return;
      }
      const unitPrice = Number(orderItem.unit_price || 0);
      const discountedUnit = computeCurrentPrice(unitPrice, entry);
      const discount = Math.max(0, Math.round((unitPrice - discountedUnit) * orderQty));
      if (!discount) {
        return;
      }
      const existing = bestItemDiscount.get(orderItem.id);
      if (!existing || discount > existing.amount) {
        bestItemDiscount.set(orderItem.id, {
          amount: discount,
          campaignId: campaign.id
        });
      }
    });
  });

  bestItemDiscount.forEach((entry) => {
    campaignDiscount += entry.amount;
    campaignDiscounts.set(
      entry.campaignId,
      (campaignDiscounts.get(entry.campaignId) || 0) + entry.amount
    );
  });

  const promoResult = getPromoDiscount({
    code: order.promo_code,
    outletId: order.outlet_id,
    clientUserId: order.client_user_id,
    subtotal: subtotalFood
  });

  const promoDiscount = Math.max(0, Math.min(subtotalFood, promoResult.discount || 0));
  const totalAmount = Math.max(
    0,
    subtotalFood +
      Number(order.courier_fee || 0) +
      Number(order.service_fee || 0) -
      promoDiscount -
      campaignDiscount
  );

  const appliedCampaigns = Array.from(campaignDiscounts.entries()).map(([id, amount]) => ({
    campaign_id: id,
    discount_amount: amount
  }));

  return {
    subtotal_food: subtotalFood,
    promo_discount_amount: promoDiscount,
    campaign_discount_amount: campaignDiscount,
    total_amount: totalAmount,
    applied_campaigns: appliedCampaigns,
    promo_source: promoResult.source
  };
};

const calcSlaDueAt = (prepEtaMinutes) =>
  prepEtaMinutes ? Date.now() + Number(prepEtaMinutes) * 60 * 1000 : null;

const SLA_CONFIG = {
  courier_search_sla_minutes: 10,
  cooking_sla_minutes: 20,
  delivery_sla_minutes: 45,
  pickup_after_ready_sla_minutes: 10
};

const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };

const toMs = (value) => {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
};

const minutesBetween = (startMs, endMs) => {
  if (!startMs || !endMs) return null;
  return Math.round((endMs - startMs) / 60000);
};

const getEventTime = (events, types) => {
  const set = new Set(types);
  const match = events.find((event) => set.has(event.type));
  return match?.created_at ? toMs(match.created_at) : null;
};

const normalizeEventPayload = (payload) => {
  if (!payload) return null;
  if (typeof payload === "object") return payload;
  try {
    return JSON.parse(payload);
  } catch (error) {
    return { raw: payload };
  }
};

const computeOrderSignals = (order, events) => {
  const sortedEvents = [...events].sort(
    (a, b) => toMs(a.created_at || 0) - toMs(b.created_at || 0)
  );
  const nowMs = Date.now();
  const createdAt = getEventTime(sortedEvents, ["created"]) ?? toMs(order.created_at);
  const courierSearchStart = getEventTime(sortedEvents, ["courier_search_started"]);
  const courierAssigned = getEventTime(sortedEvents, ["courier_assigned"]);
  const cookingStart =
    getEventTime(sortedEvents, [
      "accepted",
      "accepted_by_outlet",
      "accepted_by_restaurant",
      "cooking_started"
    ]) ?? toMs(order.accepted_at);
  const readyAt = getEventTime(sortedEvents, ["ready", "ready_for_pickup"]) ?? toMs(order.ready_at);
  const pickedUpAt =
    getEventTime(sortedEvents, ["picked_up", "out_for_delivery"]) ??
    toMs(order.picked_up_at);
  const deliveredAt = getEventTime(sortedEvents, ["delivered"]) ?? toMs(order.delivered_at);

  const slaSummary = {
    courierSearchMinutes: courierSearchStart
      ? minutesBetween(courierSearchStart, courierAssigned ?? nowMs)
      : null,
    cookingMinutes: cookingStart ? minutesBetween(cookingStart, readyAt ?? nowMs) : null,
    waitingPickupMinutes: readyAt ? minutesBetween(readyAt, pickedUpAt ?? nowMs) : null,
    deliveryMinutes: pickedUpAt ? minutesBetween(pickedUpAt, deliveredAt ?? nowMs) : null,
    breaches: {
      courierSearch:
        courierSearchStart &&
        (minutesBetween(courierSearchStart, courierAssigned ?? nowMs) ??
          0) > SLA_CONFIG.courier_search_sla_minutes,
      cooking:
        cookingStart &&
        (minutesBetween(cookingStart, readyAt ?? nowMs) ?? 0) >
          SLA_CONFIG.cooking_sla_minutes,
      waitingPickup:
        readyAt &&
        (minutesBetween(readyAt, pickedUpAt ?? nowMs) ?? 0) >
          SLA_CONFIG.pickup_after_ready_sla_minutes,
      delivery:
        pickedUpAt &&
        (minutesBetween(pickedUpAt, deliveredAt ?? nowMs) ?? 0) >
          SLA_CONFIG.delivery_sla_minutes
    }
  };

  const problems = [];
  if (
    courierSearchStart &&
    !courierAssigned &&
    (slaSummary.courierSearchMinutes ?? 0) >
      SLA_CONFIG.courier_search_sla_minutes
  ) {
    problems.push({
      key: "COURIER_SEARCH_DELAYED",
      severity: "high",
      title: "Courier search delayed",
      details: `> ${SLA_CONFIG.courier_search_sla_minutes} min`
    });
  }
  if (
    cookingStart &&
    !readyAt &&
    (slaSummary.cookingMinutes ?? 0) > SLA_CONFIG.cooking_sla_minutes
  ) {
    problems.push({
      key: "COOKING_DELAYED",
      severity: "medium",
      title: "Cooking delayed",
      details: `> ${SLA_CONFIG.cooking_sla_minutes} min`
    });
  }
  if (
    readyAt &&
    !pickedUpAt &&
    (slaSummary.waitingPickupMinutes ?? 0) >
      SLA_CONFIG.pickup_after_ready_sla_minutes
  ) {
    problems.push({
      key: "READY_WAITING_PICKUP",
      severity: "high",
      title: "Ready, waiting pickup",
      details: `> ${SLA_CONFIG.pickup_after_ready_sla_minutes} min`
    });
  }
  if (
    pickedUpAt &&
    !deliveredAt &&
    (slaSummary.deliveryMinutes ?? 0) > SLA_CONFIG.delivery_sla_minutes
  ) {
    problems.push({
      key: "DELIVERY_DELAYED",
      severity: "medium",
      title: "Delivery delayed",
      details: `> ${SLA_CONFIG.delivery_sla_minutes} min`
    });
  }

  const cancelEvent = sortedEvents.find((event) => event.type === "cancelled");
  if (cancelEvent) {
    const payload = normalizeEventPayload(cancelEvent.payload);
    const reason = payload?.reason ? `Reason: ${payload.reason}` : null;
    problems.push({
      key: "CANCELLED",
      severity: "low",
      title: "Order cancelled",
      details: reason
    });
  }

  let overallSeverityRank = 0;
  let primaryProblemTitle = null;
  problems.forEach((problem) => {
    const rank = SEVERITY_RANK[problem.severity] || 0;
    if (rank > overallSeverityRank) {
      overallSeverityRank = rank;
      primaryProblemTitle = problem.title;
    }
  });
  const overallSeverity =
    overallSeverityRank === 3
      ? "high"
      : overallSeverityRank === 2
        ? "medium"
        : overallSeverityRank === 1
          ? "low"
          : "none";

  return {
    slaSummary,
    problems,
    problemsCount: problems.length,
    overallSeverity,
    overallSeverityRank,
    primaryProblemTitle
  };
};

const fetchOrderEventsMap = (orderIds) => {
  if (!orderIds.length) {
    return {};
  }
  const placeholders = orderIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT order_id, type, payload, created_at, actor_id
       FROM order_events
       WHERE order_id IN (${placeholders})
       ORDER BY created_at ASC`
    )
    .all(...orderIds);
  return rows.reduce((acc, row) => {
    if (!acc[row.order_id]) {
      acc[row.order_id] = [];
    }
    acc[row.order_id].push({
      ...row,
      payload: normalizeEventPayload(row.payload)
    });
    return acc;
  }, {});
};

const buildFilters = (items) => {
  const conditions = [];
  const params = {};
  items.forEach(({ value, clause, paramName }) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    conditions.push(clause);
    params[paramName] = value;
  });

  return { conditions, params };
};

const logUserActivity = ({ user_id, event_type, details }) => {
  createUserActivityStmt.run({ user_id, event_type, details });
};

const logUserAudit = ({ user_id, actor, action, before, after }) => {
  createUserAuditStmt.run({
    user_id,
    actor,
    action,
    before_json: before ? JSON.stringify(before) : null,
    after_json: after ? JSON.stringify(after) : null
  });
};

const logAudit = ({ entity_type, entity_id, action, actor_id, before, after }) => {
  db.prepare(
    "INSERT INTO audit_log (entity_type, entity_id, action, actor_user_id, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    entity_type,
    String(entity_id),
    action,
    actor_id ?? null,
    before ? JSON.stringify(before) : null,
    after ? JSON.stringify(after) : null
  );
};

const getActorId = (req) => {
  const tgId = req.header("x-actor-tg");
  if (!tgId) {
    return null;
  }
  const actor = db.prepare("SELECT id FROM users WHERE tg_id = ?").get(tgId);
  return actor?.id ?? null;
};

const logOrderEvent = ({ order_id, type, payload, actor_id }) => {
  db.prepare(
    "INSERT INTO order_events (order_id, type, payload, actor_id) VALUES (?, ?, ?, ?)"
  ).run(order_id, type, payload ? JSON.stringify(payload) : null, actor_id);
};

function parseJsonSafe(value, fallback = {}) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const normalizeJsonArrayInput = (value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return JSON.stringify([]);
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch {
      const parts = trimmed
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      return JSON.stringify(parts);
    }
  }
  return null;
};

const fetchItemProfile = (db, outletId, itemId) => {
  const row = db
    .prepare(
      `SELECT outlet_items.outlet_id,
              outlet_items.item_id,
              outlet_items.base_price,
              outlet_items.is_available,
              outlet_items.stock,
              outlet_items.stock_qty,
              outlet_items.is_visible,
              outlet_items.unavailable_reason,
              outlet_items.unavailable_until,
              outlet_items.stoplist_active,
              outlet_items.stoplist_until,
              outlet_items.stoplist_reason,
              outlet_items.delivery_methods,
              outlet_items.updated_at as outlet_updated_at,
              items.title,
              items.short_title,
              items.category,
              items.categories,
              items.sku,
              items.description,
              items.photo_url,
              items.image_url,
              items.image_enabled,
              items.weight_grams,
              items.priority,
              items.is_adult,
              items.kcal,
              items.protein,
              items.fat,
              items.carbs,
              items.core_id,
              items.origin_id,
              items.created_at,
              items.updated_at
       FROM outlet_items
       JOIN items ON items.id = outlet_items.item_id
       WHERE outlet_items.outlet_id = ? AND outlet_items.item_id = ?`
    )
    .get(outletId, itemId);

  if (!row) {
    return null;
  }

  const campaign = db
    .prepare(
      `SELECT outlet_campaign_items.item_id,
              outlet_campaign_items.discount_type,
              outlet_campaign_items.discount_value,
              outlet_campaigns.id as campaign_id,
              outlet_campaigns.title
       FROM outlet_campaign_items
       JOIN outlet_campaigns ON outlet_campaigns.id = outlet_campaign_items.campaign_id
       WHERE outlet_campaigns.outlet_id = @outlet_id
         AND outlet_campaign_items.item_id = @item_id
         AND outlet_campaigns.status = 'active'
         AND (outlet_campaigns.start_at IS NULL OR outlet_campaigns.start_at <= datetime('now'))
         AND (outlet_campaigns.end_at IS NULL OR outlet_campaigns.end_at >= datetime('now'))
       LIMIT 1`
    )
    .get({ outlet_id: outletId, item_id: itemId });

  const basePrice = Number(row.base_price || 0);
  const stoplistActive = Number(row.stoplist_active) === 1;
  return {
    outletId,
    itemId,
    title: row.title,
    shortTitle: row.short_title,
    category: row.category,
    categories: parseJsonSafe(row.categories, []),
    sku: row.sku,
    description: row.description,
    photoUrl: row.photo_url,
    imageUrl: row.image_url || row.photo_url,
    imageEnabled: Number(row.image_enabled ?? 1) === 1,
    weightGrams: row.weight_grams,
    priority: row.priority ?? 0,
    isAdult: Number(row.is_adult ?? 0) === 1,
    kcal: row.kcal,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    coreId: row.core_id,
    originId: row.origin_id,
    basePrice,
    currentPrice: computeCurrentPrice(basePrice, campaign),
    isAvailable: row.is_available,
    stockQty: row.stock_qty ?? row.stock,
    stock: row.stock_qty ?? row.stock,
    isVisible: Number(row.is_visible ?? 1) === 1,
    stoplistActive,
    stoplistReason: row.stoplist_reason,
    stoplistUntil: row.stoplist_until,
    unavailableReason: stoplistActive ? row.stoplist_reason : row.unavailable_reason,
    unavailableUntil: stoplistActive ? row.stoplist_until : row.unavailable_until,
    deliveryMethods: parseJsonSafe(row.delivery_methods, []),
    activeCampaign: campaign
      ? {
          campaignId: campaign.campaign_id,
          title: campaign.title,
          discount_type: campaign.discount_type,
          discount_value: campaign.discount_value
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    outletUpdatedAt: row.outlet_updated_at
  };
};

const applyCancellationEffects = ({
  order,
  effects,
  actorRole,
  actorTg,
  actorId
}) => {
  const outlet = db
    .prepare("SELECT partner_id FROM outlets WHERE id = ?")
    .get(order.outlet_id);
  const partnerId = outlet?.partner_id ?? null;

  const resolveEntity = ({ user_id, partner_id, category }) => {
    if (partner_id) {
      return { entity_type: "partner", entity_id: partner_id };
    }
    if (user_id) {
      if (category === "courier") {
        return { entity_type: "courier", entity_id: user_id };
      }
      return { entity_type: "client", entity_id: user_id };
    }
    return { entity_type: null, entity_id: null };
  };

  const createLedgerEntry = ({
    title,
    amount,
    type,
    category,
    user_id,
    partner_id,
    order_id,
    direction = "credit",
    meta
  }) => {
    if (!amount || Number.isNaN(Number(amount))) {
      return;
    }
    const normalized = Math.abs(Number(amount));
    if (!normalized) {
      return;
    }
    const balanceDelta = direction === "debit" ? -normalized : normalized;
    const entity = resolveEntity({ user_id, partner_id, category });
    createLedgerStmt.run({
      title,
      amount: normalized,
      status: "completed",
      type,
      user_id: user_id ?? null,
      partner_id: partner_id ?? null,
      order_id: order_id ?? null,
      balance_delta: balanceDelta,
      category,
      entity_type: entity.entity_type,
      entity_id: entity.entity_id,
      currency: "UZS",
      meta_json: meta ? JSON.stringify(meta) : null,
      created_by_role: actorRole,
      created_by_tg_id: actorTg || null
    });
  };

  const createOrderAdjustment = ({ kind, amount, reason_code, comment }) => {
    if (!amount || Number.isNaN(Number(amount))) {
      return;
    }
    insertOrderAdjustmentStmt.run({
      order_id: order.id,
      kind,
      amount: Math.abs(Number(amount)),
      reason_code: reason_code || null,
      comment: comment || null,
      created_by_role: actorRole,
      created_by_tg_id: actorTg || null,
      created_at: nowIso()
    });
  };

  if (effects.refund_client) {
    createLedgerEntry({
      title: `Refund for ${order.order_number}`,
      amount: order.total_amount ?? 0,
      type: "refund",
      category: "refund",
      user_id: order.client_user_id,
      order_id: order.id,
      direction: "credit",
      meta: { reason: "cancel", order_id: order.id }
    });
    createOrderAdjustment({
      kind: "refund",
      amount: order.total_amount ?? 0,
      reason_code: "cancel_refund",
      comment: "auto"
    });
  }

  if (effects.compensate_partner) {
    createLedgerEntry({
      title: `Partner компенсация ${order.order_number}`,
      amount: order.subtotal_food ?? 0,
      type: "compensation",
      category: "partner",
      partner_id: partnerId,
      order_id: order.id,
      direction: "credit",
      meta: { reason: "cancel_compensation", order_id: order.id }
    });
    createOrderAdjustment({
      kind: "compensation",
      amount: order.subtotal_food ?? 0,
      reason_code: "cancel_compensation",
      comment: "auto"
    });
  }

  if (effects.penalty_partner) {
    createLedgerEntry({
      title: `Partner штраф ${order.order_number}`,
      amount: order.restaurant_penalty ?? 0,
      type: "penalty",
      category: "partner",
      partner_id: partnerId,
      order_id: order.id,
      direction: "debit",
      meta: { reason: "cancel_penalty", order_id: order.id }
    });
  }

  if (effects.penalty_courier) {
    createLedgerEntry({
      title: `Courier penalty ${order.order_number}`,
      amount: order.courier_penalty ?? 0,
      type: "penalty",
      category: "courier",
      user_id: order.courier_user_id,
      order_id: order.id,
      direction: "debit",
      meta: { reason: "cancel_penalty", order_id: order.id }
    });
  }

  logAudit({
    entity_type: "order_cancellation_effects",
    entity_id: order.id,
    action: "apply",
    actor_id: actorId,
    before: null,
    after: {
      order_id: order.id,
      effects,
      actor_role: actorRole,
      actor_tg: actorTg
    }
  });
};

const parseSort = (value, allowed, fallback) => {
  if (!value) {
    return fallback;
  }
  const [field, directionRaw] = String(value).split(":");
  const direction = directionRaw?.toLowerCase() === "desc" ? "DESC" : "ASC";
  if (!allowed[field]) {
    return fallback;
  }
  return `${allowed[field]} ${direction}`;
};

const createUserStmt = db.prepare(
  "INSERT INTO users (tg_id, username, status, role, updated_at, last_active) VALUES (@tg_id, @username, @status, @role, @updated_at, @last_active)"
);
const updateUserStmt = db.prepare(
  `UPDATE users
   SET username = COALESCE(@username, username),
       status = COALESCE(@status, status),
       role = COALESCE(@role, role),
       updated_at = @updated_at
   WHERE id = @id`
);
const deleteUserStmt = db.prepare("DELETE FROM users WHERE id = ?");
const createUserActivityStmt = db.prepare(
  "INSERT INTO user_activity (user_id, event_type, details) VALUES (@user_id, @event_type, @details)"
);
const createUserAuditStmt = db.prepare(
  "INSERT INTO user_audit (user_id, actor, action, before_json, after_json) VALUES (@user_id, @actor, @action, @before_json, @after_json)"
);

const getClientProfileStmt = db.prepare(
  `SELECT clients.user_id as id,
          clients.full_name as name,
          clients.phone as phone,
          users.status as status,
          users.tg_id as tg_id,
          users.username as username,
          users.created_at as created_at,
          users.updated_at as updated_at
   FROM clients
   JOIN users ON users.id = clients.user_id
   WHERE clients.user_id = ?`
);
const getClientCrmNoteStmt = db.prepare(
  `SELECT note, updated_at, updated_by_role, updated_by_tg_id
   FROM client_crm_notes
   WHERE client_user_id = ?`
);
const upsertClientCrmNoteStmt = db.prepare(
  `INSERT INTO client_crm_notes
    (id, client_user_id, note, updated_by_role, updated_by_tg_id, created_at, updated_at)
   VALUES (@id, @client_user_id, @note, @updated_by_role, @updated_by_tg_id, @created_at, @updated_at)
   ON CONFLICT(client_user_id) DO UPDATE SET
     note = excluded.note,
     updated_by_role = excluded.updated_by_role,
     updated_by_tg_id = excluded.updated_by_tg_id,
     updated_at = excluded.updated_at`
);
const getClientSubscriptionsStmt = db.prepare(
  `SELECT client_user_id,
          email_opt_in,
          push_opt_in,
          sms_opt_in,
          food_email,
          food_push,
          food_sms,
          market_email,
          market_push,
          market_sms,
          taxi_email,
          taxi_push,
          taxi_sms,
          updated_at,
          updated_by_role,
          updated_by_tg_id
   FROM client_subscriptions
   WHERE client_user_id = ?`
);
const upsertClientSubscriptionsStmt = db.prepare(
  `INSERT INTO client_subscriptions
    (client_user_id, email_opt_in, push_opt_in, sms_opt_in,
     food_email, food_push, food_sms,
     market_email, market_push, market_sms,
     taxi_email, taxi_push, taxi_sms,
     updated_at, updated_by_role, updated_by_tg_id)
   VALUES (@client_user_id, @email_opt_in, @push_opt_in, @sms_opt_in,
           @food_email, @food_push, @food_sms,
           @market_email, @market_push, @market_sms,
           @taxi_email, @taxi_push, @taxi_sms,
           @updated_at, @updated_by_role, @updated_by_tg_id)
   ON CONFLICT(client_user_id) DO UPDATE SET
     email_opt_in = excluded.email_opt_in,
     push_opt_in = excluded.push_opt_in,
     sms_opt_in = excluded.sms_opt_in,
     food_email = excluded.food_email,
     food_push = excluded.food_push,
     food_sms = excluded.food_sms,
     market_email = excluded.market_email,
     market_push = excluded.market_push,
     market_sms = excluded.market_sms,
     taxi_email = excluded.taxi_email,
     taxi_push = excluded.taxi_push,
     taxi_sms = excluded.taxi_sms,
     updated_at = excluded.updated_at,
     updated_by_role = excluded.updated_by_role,
     updated_by_tg_id = excluded.updated_by_tg_id`
);
const insertClientSensitiveActionStmt = db.prepare(
  `INSERT INTO client_sensitive_actions
    (id, client_user_id, action_type, reason, created_by_role, created_by_tg_id, created_at)
   VALUES (@id, @client_user_id, @action_type, @reason, @created_by_role, @created_by_tg_id, @created_at)`
);

const createPartnerStmt = db.prepare(
  `INSERT INTO partners
   (name, manager, status, contact_name, phone_primary, phone_secondary, phone_tertiary, email)
   VALUES (@name, @manager, @status, @contact_name, @phone_primary, @phone_secondary, @phone_tertiary, @email)`
);
const updatePartnerStmt = db.prepare(
  `UPDATE partners
   SET name = COALESCE(@name, name),
       manager = COALESCE(@manager, manager),
       status = COALESCE(@status, status),
       contact_name = COALESCE(@contact_name, contact_name),
       phone_primary = COALESCE(@phone_primary, phone_primary),
       phone_secondary = COALESCE(@phone_secondary, phone_secondary),
       phone_tertiary = COALESCE(@phone_tertiary, phone_tertiary),
       email = COALESCE(@email, email)
   WHERE id = @id`
);
const deletePartnerStmt = db.prepare("DELETE FROM partners WHERE id = ?");

const createOutletStmt = db.prepare(
  `INSERT INTO outlets
   (partner_id, type, name, address, is_active, status, hours, delivery_zone, phone, email, address_comment, status_reason, status_updated_at)
   VALUES (@partner_id, @type, @name, @address, @is_active, @status, @hours, @delivery_zone, @phone, @email, @address_comment, @status_reason, @status_updated_at)`
);
const updateOutletStmt = db.prepare(
  `UPDATE outlets
   SET partner_id = COALESCE(@partner_id, partner_id),
       type = COALESCE(@type, type),
       name = COALESCE(@name, name),
       address = COALESCE(@address, address),
       is_active = COALESCE(@is_active, is_active),
       status = COALESCE(@status, status),
       hours = COALESCE(@hours, hours),
       delivery_zone = COALESCE(@delivery_zone, delivery_zone),
       phone = COALESCE(@phone, phone),
       email = COALESCE(@email, email),
       address_comment = COALESCE(@address_comment, address_comment),
       status_reason = COALESCE(@status_reason, status_reason),
       status_updated_at = COALESCE(@status_updated_at, status_updated_at)
   WHERE id = @id`
);
const deleteOutletStmt = db.prepare("DELETE FROM outlets WHERE id = ?");

const createCourierStmt = db.prepare(
  `INSERT INTO couriers
   (user_id, is_active, rating_avg, rating_count, phone, full_name, address, delivery_methods)
   VALUES (@user_id, @is_active, @rating_avg, @rating_count, @phone, @full_name, @address, @delivery_methods)`
);
const updateCourierStmt = db.prepare(
  `UPDATE couriers
   SET is_active = COALESCE(@is_active, is_active),
       rating_avg = COALESCE(@rating_avg, rating_avg),
       rating_count = COALESCE(@rating_count, rating_count),
       phone = COALESCE(@phone, phone),
       full_name = COALESCE(@full_name, full_name),
       address = COALESCE(@address, address),
       delivery_methods = COALESCE(@delivery_methods, delivery_methods)
   WHERE user_id = @user_id`
);
const deleteCourierStmt = db.prepare("DELETE FROM couriers WHERE user_id = ?");

const getOrderStmt = db.prepare(
  `SELECT id, order_number, outlet_id, client_user_id, courier_user_id, status,
          pickup_attempts, pickup_code_hash, pickup_code_plain, pickup_locked_until,
          accepted_at, ready_at, picked_up_at, delivered_at, prep_eta_minutes,
          sla_due_at, sla_breached, total_amount, delivery_address, created_at
   FROM orders WHERE id = ?`
);
const createOrderStmt = db.prepare(
  `INSERT INTO orders (order_number, outlet_id, client_user_id, courier_user_id, status, total_amount, delivery_address)
   VALUES (@order_number, @outlet_id, @client_user_id, @courier_user_id, @status, @total_amount, @delivery_address)`
);
const updateOrderStmt = db.prepare(
  `UPDATE orders
     SET status = COALESCE(@status, status),
          courier_user_id = COALESCE(@courier_user_id, courier_user_id),
          prep_eta_minutes = COALESCE(@prep_eta_minutes, prep_eta_minutes),
          total_amount = COALESCE(@total_amount, total_amount),
          delivery_address = COALESCE(@delivery_address, delivery_address)
     WHERE id = @id`
);
const getOrderCancelStmt = db.prepare(
  `SELECT orders.id,
          orders.order_number,
          orders.outlet_id,
          orders.client_user_id,
          orders.courier_user_id,
          orders.status,
          orders.subtotal_food,
          orders.total_amount,
          orders.restaurant_penalty,
          orders.courier_penalty,
          orders.promo_code
   FROM orders
   WHERE orders.id = ?`
);
const updateOrderCancelStmt = db.prepare(
  `UPDATE orders
   SET status = 'cancelled',
       cancelled_at = @cancelled_at
   WHERE id = @id`
);
const insertOrderCancellationStmt = db.prepare(
  `INSERT INTO order_cancellations
    (id, order_id, group_code, reason_code, comment, notify_client, client_notified,
     effects_json, created_by_role, created_by_tg_id, created_at)
   VALUES (@id, @order_id, @group_code, @reason_code, @comment, @notify_client,
           @client_notified, @effects_json, @created_by_role, @created_by_tg_id, @created_at)`
);
const listCancelReasonsStmt = db.prepare(
  `SELECT code,
          group_code,
          label_ru,
          label_uz,
          label_kaa,
          label_en,
          requires_comment,
          effects_json
   FROM cancel_reasons
   WHERE is_active = 1
   ORDER BY group_code, code`
);
const getCancelReasonStmt = db.prepare(
  `SELECT code,
          group_code,
          label_ru,
          label_uz,
          label_kaa,
          label_en,
          requires_comment,
          effects_json
   FROM cancel_reasons
   WHERE code = ? AND is_active = 1`
);
const getOrderPricingStmt = db.prepare(
  `SELECT id,
          subtotal_food,
          courier_fee,
          service_fee,
          discount_amount,
          promo_discount_amount,
          campaign_discount_amount,
          promo_code,
          outlet_id,
          client_user_id,
          total_amount
   FROM orders WHERE id = ?`
);
const getOrderItemsStmt = db.prepare(
  `SELECT id,
          item_id,
          title,
          description,
          photo_url,
          sku,
          weight_grams,
          unit_price,
          quantity,
          total_price
   FROM order_items
   WHERE order_id = ?
   ORDER BY id ASC`
);
const insertOrderItemStmt = db.prepare(
  `INSERT INTO order_items (order_id, item_id, title, description, photo_url, sku, weight_grams, unit_price, quantity, total_price)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const updateOrderItemStmt = db.prepare(
  `UPDATE order_items
   SET item_id = ?,
       title = ?,
       description = ?,
       photo_url = ?,
       sku = ?,
       weight_grams = ?,
       unit_price = ?,
       quantity = ?,
       total_price = ?
   WHERE id = ? AND order_id = ?`
);
const deleteOrderItemStmt = db.prepare(
  "DELETE FROM order_items WHERE id = ? AND order_id = ?"
);
const deleteCampaignUsageByOrderStmt = db.prepare(
  "DELETE FROM campaign_usage WHERE order_id = ?"
);
const insertCampaignUsageStmt = db.prepare(
  `INSERT INTO campaign_usage (campaign_id, order_id, client_user_id, discount_amount, applied_at)
   VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
);
const updateOrderTotalsStmt = db.prepare(
  `UPDATE orders
   SET subtotal_food = @subtotal_food,
       discount_amount = @discount_amount,
       promo_discount_amount = @promo_discount_amount,
       campaign_discount_amount = @campaign_discount_amount,
       campaign_ids = @campaign_ids,
       total_amount = @total_amount
   WHERE id = @id`
);
const updateOrderAcceptStmt = db.prepare(
  `UPDATE orders
   SET status = 'accepted_by_restaurant',
       accepted_at = @accepted_at,
       prep_eta_minutes = @prep_eta_minutes,
       pickup_code_hash = @pickup_code_hash,
       pickup_code_plain = @pickup_code_plain,
       pickup_attempts = 0,
       pickup_locked_until = NULL,
       sla_due_at = @sla_due_at,
       sla_breached = 0
   WHERE id = @id`
);
const updateOrderReadyStmt = db.prepare(
  `UPDATE orders
   SET status = 'ready_for_pickup',
       ready_at = @ready_at,
       sla_breached = @sla_breached
   WHERE id = @id`
);
const updateOrderPickupStmt = db.prepare(
  `UPDATE orders
   SET status = 'picked_up',
       picked_up_at = @picked_up_at,
       pickup_attempts = 0,
       pickup_locked_until = NULL
   WHERE id = @id`
);
const updateOrderDeliverStmt = db.prepare(
  `UPDATE orders
   SET status = 'delivered',
       delivered_at = @delivered_at,
       sla_breached = @sla_breached
   WHERE id = @id`
);
const updateOrderAttemptsStmt = db.prepare(
  `UPDATE orders
   SET pickup_attempts = @pickup_attempts,
       pickup_locked_until = @pickup_locked_until
   WHERE id = @id`
);

const deleteOrderStmt = db.prepare("DELETE FROM orders WHERE id = ?");

const listPromosStmt = (filters) => {
  let sql =
    `SELECT promo_codes.id,
            promo_codes.code,
            promo_codes.description,
            promo_codes.discount_percent,
            promo_codes.max_uses,
            promo_codes.used_count,
            promo_codes.is_active,
            promo_codes.created_at,
            promo_codes.starts_at,
            promo_codes.ends_at,
            promo_codes.min_order_amount,
            promo_codes.outlet_id,
            promo_codes.first_order_only,
            GROUP_CONCAT(promo_outlets.outlet_id) as outlet_ids,
            GROUP_CONCAT(outlets.name) as outlet_names
     FROM promo_codes
     LEFT JOIN promo_outlets ON promo_outlets.promo_code_id = promo_codes.id
     LEFT JOIN outlets ON outlets.id = promo_outlets.outlet_id`;
  const { conditions, params } = buildFilters(filters);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " GROUP BY promo_codes.id ORDER BY promo_codes.id";
  return db.prepare(sql).all(params);
};
const getPromoWithOutletsStmt = db.prepare(
  `SELECT promo_codes.id,
          promo_codes.code,
          promo_codes.description,
          promo_codes.discount_percent,
          promo_codes.max_uses,
          promo_codes.used_count,
          promo_codes.is_active,
          promo_codes.created_at,
          promo_codes.starts_at,
          promo_codes.ends_at,
          promo_codes.min_order_amount,
          promo_codes.outlet_id,
          promo_codes.first_order_only,
          GROUP_CONCAT(promo_outlets.outlet_id) as outlet_ids,
          GROUP_CONCAT(outlets.name) as outlet_names
   FROM promo_codes
   LEFT JOIN promo_outlets ON promo_outlets.promo_code_id = promo_codes.id
   LEFT JOIN outlets ON outlets.id = promo_outlets.outlet_id
   WHERE promo_codes.id = ?
   GROUP BY promo_codes.id`
);

const createPromoStmt = db.prepare(
  `INSERT INTO promo_codes (code, description, discount_percent, max_uses, used_count, is_active, starts_at, ends_at, min_order_amount, outlet_id, first_order_only)
   VALUES (@code, @description, @discount_percent, @max_uses, @used_count, @is_active, @starts_at, @ends_at, @min_order_amount, @outlet_id, @first_order_only)`
);
const updatePromoStmt = db.prepare(
  `UPDATE promo_codes
   SET code = COALESCE(@code, code),
       description = COALESCE(@description, description),
       discount_percent = COALESCE(@discount_percent, discount_percent),
       max_uses = COALESCE(@max_uses, max_uses),
       used_count = COALESCE(@used_count, used_count),
       is_active = COALESCE(@is_active, is_active),
       starts_at = COALESCE(@starts_at, starts_at),
       ends_at = COALESCE(@ends_at, ends_at),
       min_order_amount = COALESCE(@min_order_amount, min_order_amount),
       outlet_id = CASE WHEN @outlet_id_set = 1 THEN @outlet_id ELSE outlet_id END,
       first_order_only = COALESCE(@first_order_only, first_order_only)
   WHERE id = @id`
);
const deletePromoStmt = db.prepare("DELETE FROM promo_codes WHERE id = ?");
const deletePromoOutletsStmt = db.prepare(
  "DELETE FROM promo_outlets WHERE promo_code_id = ?"
);
const insertPromoOutletStmt = db.prepare(
  "INSERT OR IGNORE INTO promo_outlets (promo_code_id, outlet_id) VALUES (?, ?)"
);

const normalizePromoOutlets = (payload) => {
  const outletIds = Array.isArray(payload?.outlet_ids)
    ? payload.outlet_ids
    : payload?.outlet_id
      ? [payload.outlet_id]
      : [];
  const normalized = outletIds
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  return Array.from(new Set(normalized));
};

const attachPromoOutlets = (promo) => {
  const outletIds = promo.outlet_ids
    ? String(promo.outlet_ids)
        .split(",")
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value))
    : promo.outlet_id
      ? [promo.outlet_id]
      : [];
  const outletNames = promo.outlet_names
    ? String(promo.outlet_names).split(",")
    : [];
  return {
    ...promo,
    outlet_ids: outletIds,
    outlet_names: outletNames.filter(Boolean)
  };
};

const listLedgerStmt = (filters) => {
  let sql =
    "SELECT id, title, amount, status, type, created_at, user_id, partner_id, order_id, balance_delta, category, entity_type, entity_id, currency, meta_json, created_by_role, created_by_tg_id FROM finance_ledger";
  const { conditions, params } = buildFilters(filters);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY id DESC";
  return db.prepare(sql).all(params);
};
const createLedgerStmt = db.prepare(
  `INSERT INTO finance_ledger (
      title,
      amount,
      status,
      type,
      user_id,
      partner_id,
      order_id,
      balance_delta,
      category,
      entity_type,
      entity_id,
      currency,
      meta_json,
      created_by_role,
      created_by_tg_id
   )
   VALUES (
      @title,
      @amount,
      @status,
      @type,
      @user_id,
      @partner_id,
      @order_id,
      @balance_delta,
      @category,
      @entity_type,
      @entity_id,
      @currency,
      @meta_json,
      @created_by_role,
      @created_by_tg_id
   )`
);
const updateLedgerStmt = db.prepare(
  `UPDATE finance_ledger
   SET title = COALESCE(@title, title),
       amount = COALESCE(@amount, amount),
       status = COALESCE(@status, status),
       type = COALESCE(@type, type),
       user_id = COALESCE(@user_id, user_id),
       partner_id = COALESCE(@partner_id, partner_id),
       order_id = COALESCE(@order_id, order_id),
       balance_delta = COALESCE(@balance_delta, balance_delta),
       category = COALESCE(@category, category),
       entity_type = COALESCE(@entity_type, entity_type),
       entity_id = COALESCE(@entity_id, entity_id),
       currency = COALESCE(@currency, currency),
       meta_json = COALESCE(@meta_json, meta_json),
       created_by_role = COALESCE(@created_by_role, created_by_role),
       created_by_tg_id = COALESCE(@created_by_tg_id, created_by_tg_id)
   WHERE id = @id`
);
const deleteLedgerStmt = db.prepare("DELETE FROM finance_ledger WHERE id = ?");
const insertOrderAdjustmentStmt = db.prepare(
  `INSERT INTO order_adjustments (order_id, kind, amount, reason_code, comment, created_by_role, created_by_tg_id, created_at)
   VALUES (@order_id, @kind, @amount, @reason_code, @comment, @created_by_role, @created_by_tg_id, @created_at)`
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/users", (_req, res) => {
  const { q, status, role } = _req.query;
  let sql = "SELECT id, tg_id, username, status, role FROM users";
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "(tg_id LIKE @q OR username LIKE @q)",
      paramName: "q"
    },
    { value: status, clause: "status = @status", paramName: "status" },
    { value: role, clause: "role = @role", paramName: "role" }
  ]);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY id";
  res.json(db.prepare(sql).all(params));
});

app.post("/api/users", requireRole(["admin"]), (req, res) => {
  const payload = {
    tg_id: req.body.tg_id,
    username: req.body.username ?? null,
    status: req.body.status ?? "active",
    role: req.body.role ?? "client",
    updated_at: nowIso(),
    last_active: nowIso()
  };
  const result = createUserStmt.run(payload);
  const user = db
    .prepare(
      "SELECT id, tg_id, username, status, role, created_at, updated_at, last_active FROM users WHERE id = ?"
    )
    .get(result.lastInsertRowid);
  logUserAudit({
    user_id: user.id,
    actor: "system",
    action: "create",
    before: null,
    after: { status: user.status, role: user.role, username: user.username }
  });
  logAudit({
    entity_type: "user",
    entity_id: user.id,
    action: "create",
    actor_id: getActorId(req),
    before: null,
    after: user
  });
  res.status(201).json(user);
});

app.get("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = db
    .prepare(
      "SELECT id, tg_id, username, status, role, created_at, updated_at, last_active FROM users WHERE id = ?"
    )
    .get(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
});

app.patch("/api/users/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const user = db
    .prepare(
      "SELECT id, tg_id, username, status, role, created_at, updated_at, last_active FROM users WHERE id = ?"
    )
    .get(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const before = { ...user };
  updateUserStmt.run({
    id,
    username: req.body.username ?? null,
    status: req.body.status ?? null,
    role: req.body.role ?? null,
    updated_at: nowIso()
  });
  const updated = db
    .prepare(
      "SELECT id, tg_id, username, status, role, created_at, updated_at, last_active FROM users WHERE id = ?"
    )
    .get(id);
  if (before.status !== updated.status) {
    logUserActivity({
      user_id: id,
      event_type: "status_change",
      details: `${before.status} -> ${updated.status}`
    });
  }
  logUserAudit({
    user_id: id,
    actor: "admin",
    action: "update",
    before,
    after: updated
  });
  logAudit({
    entity_type: "user",
    entity_id: id,
    action: "update",
    actor_id: getActorId(req),
    before,
    after: updated
  });
  return res.json(updated);
});

app.delete("/api/users/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const user = db
    .prepare("SELECT id, tg_id, username, status, role FROM users WHERE id = ?")
    .get(id);
  deleteUserStmt.run(id);
  if (user) {
    logUserAudit({
      user_id: id,
      actor: "admin",
      action: "delete",
      before: user,
      after: null
    });
    logAudit({
      entity_type: "user",
      entity_id: id,
      action: "delete",
      actor_id: getActorId(req),
      before: user,
      after: null
    });
  }
  res.status(204).send();
});

app.get("/api/users/:id/orders", (req, res) => {
  const id = Number(req.params.id);
  const user = db
    .prepare("SELECT id, role FROM users WHERE id = ?")
    .get(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { q, status } = req.query;
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.page_size || 10);
  const offset = (page - 1) * pageSize;
  const userClause =
    user.role === "courier"
      ? "orders.courier_user_id = @user_id"
      : "orders.client_user_id = @user_id";

  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "orders.order_number LIKE @q",
      paramName: "q"
    },
    {
      value: status,
      clause: "orders.status = @status",
      paramName: "status"
    }
  ]);

  const where = [userClause, ...conditions].join(" AND ");
  const baseParams = { ...params, user_id: id };

  const count = db
    .prepare(`SELECT COUNT(*) as count FROM orders WHERE ${where}`)
    .get(baseParams).count;

  const items = db
    .prepare(
      `SELECT orders.id as id,
              orders.order_number,
              orders.status,
              orders.created_at,
              orders.total_amount,
              orders.delivery_address,
              orders.courier_user_id,
              outlets.name as outlet_name
       FROM orders
       LEFT JOIN outlets ON outlets.id = orders.outlet_id
       WHERE ${where}
       ORDER BY orders.created_at DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...baseParams, limit: pageSize, offset });

  res.json({
    items,
    page,
    page_size: pageSize,
    total: count
  });
});

app.get("/api/users/:id/finance", (req, res) => {
  const id = Number(req.params.id);
  const user = db
    .prepare("SELECT id, role FROM users WHERE id = ?")
    .get(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const ledger = db
    .prepare(
      `SELECT id, title, amount, status, type, created_at, order_id, balance_delta, category
       FROM finance_ledger
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .all(id);

  const sumByType = (type) =>
    ledger
      .filter((row) => row.type === type)
      .reduce((acc, row) => acc + Number(row.amount || 0), 0);

  const balance = ledger.reduce(
    (acc, row) => acc + Number(row.balance_delta || 0),
    0
  );

  let summary;
  if (user.role === "courier") {
    summary = [
      { label: "Р‘Р°Р»Р°РЅСЃ", value: balance },
      { label: "Р’С‹РїР»Р°С‚С‹", value: sumByType("courier_payout") },
      { label: "РЁС‚СЂР°С„С‹", value: sumByType("penalty") },
      { label: "Р‘РѕРЅСѓСЃС‹", value: sumByType("bonus") }
    ];
  } else {
    summary = [
      { label: "РџР»Р°С‚РµР¶Рё", value: sumByType("payment") },
      { label: "Р’РѕР·РІСЂР°С‚С‹", value: sumByType("refund") },
      { label: "РџСЂРѕРјРѕРєРѕРґС‹", value: sumByType("promo") }
    ];
  }

  res.json({
    role: user.role,
    balance,
    summary,
    transactions: ledger
  });
});

app.get("/api/users/:id/activity", (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const rows = db
    .prepare(
      `SELECT id, event_type, details, created_at
       FROM user_activity
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`
    )
    .all(id);
  res.json(rows);
});

app.get("/api/users/:id/audit", (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const rows = db
    .prepare(
      `SELECT id, actor, action, before_json, after_json, created_at
       FROM user_audit
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`
    )
    .all(id);
  res.json(rows);
});

app.get("/api/clients", (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : null;
  const status = req.query.status || null;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const sort = parseSort(
    req.query.sort,
    {
      name: "clients.full_name",
      phone: "clients.phone",
      ordersCount: "orders_count",
      status: "users.status",
      lastOrderAt: "last_order_at"
    },
    "clients.full_name ASC"
  );

  const { conditions, params } = buildFilters([
    {
      value: search,
      clause: "(clients.full_name LIKE @search OR clients.phone LIKE @search)",
      paramName: "search"
    },
    { value: status, clause: "users.status = @status", paramName: "status" }
  ]);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const count = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM clients
       JOIN users ON users.id = clients.user_id
       ${where}`
    )
    .get(params).count;

  const rows = db
    .prepare(
      `SELECT clients.user_id as id,
              clients.full_name as name,
              clients.phone as phone,
              users.status as status,
              users.tg_id as tg_id,
              users.username as username,
              COALESCE(stats.orders_count, 0) as orders_count,
              stats.last_order_at as last_order_at
       FROM clients
       JOIN users ON users.id = clients.user_id
       LEFT JOIN (
         SELECT client_user_id,
                COUNT(*) as orders_count,
                MAX(created_at) as last_order_at
         FROM orders
         GROUP BY client_user_id
       ) stats ON stats.client_user_id = clients.user_id
       ${where}
       ORDER BY ${sort}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });

  res.json({ items: rows, page, limit, total: count });
});

app.get("/api/clients/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = getClientProfileStmt.get(id);
  if (!row) {
    return res.status(404).json({ error: "Client not found" });
  }
  const crm = getClientCrmNoteStmt.get(id);
  const subscriptions = getClientSubscriptionsStmt.get(id);
  res.json({
    ...row,
    crm_note: crm?.note ?? null,
    crm_updated_at: crm?.updated_at ?? null,
    subscriptions: subscriptions || {
      client_user_id: id,
      email_opt_in: 0,
      push_opt_in: 0,
      sms_opt_in: 0,
      food_email: 0,
      food_push: 0,
      food_sms: 0,
      market_email: 0,
      market_push: 0,
      market_sms: 0,
      taxi_email: 0,
      taxi_push: 0,
      taxi_sms: 0,
      updated_at: null
    }
  });
});

app.patch(
  "/api/clients/:id/crm-note",
  requireRole(["admin", "support", "operator"]),
  (req, res) => {
    const id = Number(req.params.id);
    const client = db.prepare("SELECT user_id FROM clients WHERE user_id = ?").get(id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const note = String(req.body?.note || "").trim();
    if (!note) {
      return res.status(400).json({ error: "note required" });
    }
    const now = nowIso();
    upsertClientCrmNoteStmt.run({
      id: crypto.randomUUID(),
      client_user_id: id,
      note,
      updated_by_role: getRole(req),
      updated_by_tg_id: getActorTg(req),
      created_at: now,
      updated_at: now
    });
    logAudit({
      entity_type: "client",
      entity_id: id,
      action: "crm_note_update",
      actor_id: getActorId(req),
      before: null,
      after: { note }
    });
    res.json({ note, updated_at: now });
  }
);

app.patch(
  "/api/clients/:id/subscriptions",
  requireRole(["admin", "support", "operator"]),
  (req, res) => {
    const id = Number(req.params.id);
    const client = db.prepare("SELECT user_id FROM clients WHERE user_id = ?").get(id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const payload = {
      client_user_id: id,
      email_opt_in: req.body?.email_opt_in ? 1 : 0,
      push_opt_in: req.body?.push_opt_in ? 1 : 0,
      sms_opt_in: req.body?.sms_opt_in ? 1 : 0,
      food_email: req.body?.food_email ? 1 : 0,
      food_push: req.body?.food_push ? 1 : 0,
      food_sms: req.body?.food_sms ? 1 : 0,
      market_email: req.body?.market_email ? 1 : 0,
      market_push: req.body?.market_push ? 1 : 0,
      market_sms: req.body?.market_sms ? 1 : 0,
      taxi_email: req.body?.taxi_email ? 1 : 0,
      taxi_push: req.body?.taxi_push ? 1 : 0,
      taxi_sms: req.body?.taxi_sms ? 1 : 0,
      updated_at: nowIso(),
      updated_by_role: getRole(req),
      updated_by_tg_id: getActorTg(req)
    };
    upsertClientSubscriptionsStmt.run(payload);
    logAudit({
      entity_type: "client",
      entity_id: id,
      action: "subscriptions_update",
      actor_id: getActorId(req),
      before: null,
      after: payload
    });
    res.json(payload);
  }
);

app.post(
  "/api/clients/:id/actions",
  requireRole(["admin", "support", "operator"]),
  (req, res) => {
    const id = Number(req.params.id);
    const client = db.prepare("SELECT user_id FROM clients WHERE user_id = ?").get(id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const actionType = String(req.body?.action_type || "").trim();
    const reason = String(req.body?.reason || "").trim();
    if (!actionType) {
      return res.status(400).json({ error: "action_type required" });
    }
    if (!reason) {
      return res.status(400).json({ error: "reason required" });
    }
    const entry = {
      id: crypto.randomUUID(),
      client_user_id: id,
      action_type: actionType,
      reason,
      created_by_role: getRole(req),
      created_by_tg_id: getActorTg(req),
      created_at: nowIso()
    };
    insertClientSensitiveActionStmt.run(entry);
    logAudit({
      entity_type: "client",
      entity_id: id,
      action: actionType,
      actor_id: getActorId(req),
      before: null,
      after: entry
    });
    res.status(201).json(entry);
  }
);

app.get("/api/clients/:id/compensations", (req, res) => {
  const id = Number(req.params.id);
  const client = db.prepare("SELECT user_id FROM clients WHERE user_id = ?").get(id);
  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }
  const rows = db
    .prepare(
      `SELECT id, title, amount, status, type, created_at, order_id
       FROM finance_ledger
       WHERE user_id = ?
         AND type IN ('compensation','refund','promo')
       ORDER BY created_at DESC`
    )
    .all(id);
  res.json(rows);
});

app.get("/api/clients/:id/messages", (req, res) => {
  const id = Number(req.params.id);
  const client = db.prepare("SELECT user_id FROM clients WHERE user_id = ?").get(id);
  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }
  res.json([]);
});

app.get("/api/clients/:id/audit", (req, res) => {
  const id = Number(req.params.id);
  const client = db.prepare("SELECT user_id FROM clients WHERE user_id = ?").get(id);
  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }
  const rows = db
    .prepare(
      `SELECT audit_log.id,
              audit_log.entity_type,
              audit_log.entity_id,
              audit_log.action,
              audit_log.actor_user_id,
              audit_log.before_json,
              audit_log.after_json,
              audit_log.created_at
       FROM audit_log
       WHERE audit_log.entity_type = 'client'
         AND audit_log.entity_id = ?
       ORDER BY audit_log.created_at DESC
       LIMIT 50`
    )
    .all(String(id));
  res.json(rows);
});

app.patch("/api/clients/:id", requireRole(["admin", "support", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const client = db
    .prepare("SELECT user_id, full_name, phone FROM clients WHERE user_id = ?")
    .get(id);
  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }
  const userStatus = db
    .prepare("SELECT status FROM users WHERE id = ?")
    .get(id)?.status;
  const name = req.body.name ?? null;
  const phone = req.body.phone ?? null;
  const status = req.body.status ?? null;

  const before = {
    id,
    name: client.full_name,
    phone: client.phone,
    status: userStatus
  };

  if (name !== null || phone !== null) {
    db.prepare(
      `UPDATE clients
       SET full_name = COALESCE(@name, full_name),
           phone = COALESCE(@phone, phone)
       WHERE user_id = @id`
    ).run({ id, name, phone });
  }

  if (status !== null) {
    db.prepare(
      `UPDATE users
       SET status = @status,
           updated_at = @updated_at
       WHERE id = @id`
    ).run({ id, status, updated_at: nowIso() });
  }

  const row = db
    .prepare(
      `SELECT clients.user_id as id,
              clients.full_name as name,
              clients.phone as phone,
              users.status as status,
              users.tg_id as tg_id,
              users.username as username,
              users.created_at as created_at,
              users.updated_at as updated_at
       FROM clients
       JOIN users ON users.id = clients.user_id
       WHERE clients.user_id = ?`
    )
    .get(id);
  logAudit({
    entity_type: "client",
    entity_id: id,
    action: "update",
    actor_id: getActorId(req),
    before,
    after: row
  });
  res.json(row);
});

app.get("/api/clients/:id/metrics", (req, res) => {
  const id = Number(req.params.id);
  const client = db
    .prepare("SELECT user_id FROM clients WHERE user_id = ?")
    .get(id);
  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }

  const metrics = db
    .prepare(
      `SELECT COUNT(*) as orders_count,
              MAX(created_at) as last_order_at,
              SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) as total_spent
       FROM orders
       WHERE client_user_id = ?`
    )
    .get(id);

  const ordersCount = Number(metrics.orders_count || 0);
  const totalSpent = Number(metrics.total_spent || 0);
  const avgCheck = ordersCount > 0 ? Math.round(totalSpent / ordersCount) : 0;

  res.json({
    ordersCount,
    totalSpent,
    avgCheck,
    lastOrderAt: metrics.last_order_at
  });
});

app.get("/api/clients/:id/orders", (req, res) => {
  const id = Number(req.params.id);
  const client = db
    .prepare("SELECT user_id FROM clients WHERE user_id = ?")
    .get(id);
  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }

  const { q, status } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;

  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "orders.order_number LIKE @q",
      paramName: "q"
    },
    { value: status, clause: "orders.status = @status", paramName: "status" }
  ]);

  const where = ["orders.client_user_id = @client_id", ...conditions].join(
    " AND "
  );

  const count = db
    .prepare(`SELECT COUNT(*) as count FROM orders WHERE ${where}`)
    .get({ ...params, client_id: id }).count;

  const items = db
    .prepare(
      `SELECT orders.id,
              orders.order_number,
              orders.created_at,
              orders.status,
              orders.total_amount,
              orders.delivery_address,
              orders.courier_user_id,
              outlets.name as outlet_name
       FROM orders
       LEFT JOIN outlets ON outlets.id = orders.outlet_id
       WHERE ${where}
       ORDER BY orders.created_at DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, client_id: id, limit, offset });

  res.json({ items, page, limit, total: count });
});

app.get("/api/clients/:id/notes", (req, res) => {
  const id = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT client_notes.id,
              client_notes.text,
              client_notes.created_at,
              client_notes.author_user_id,
              users.username as author_username,
              users.tg_id as author_tg_id
       FROM client_notes
       LEFT JOIN users ON users.id = client_notes.author_user_id
       WHERE client_notes.client_user_id = ?
       ORDER BY client_notes.created_at DESC`
    )
    .all(id);
  res.json(rows);
});

app.post("/api/clients/:id/notes", requireRole(["admin", "support", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const text = req.body.text;
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }
  let authorUserId = getActorId(req);
  if (!authorUserId && req.body.author_tg_id) {
    const author = db
      .prepare("SELECT id FROM users WHERE tg_id = ?")
      .get(req.body.author_tg_id);
    authorUserId = author?.id ?? null;
  }

  const result = db
    .prepare(
      "INSERT INTO client_notes (client_user_id, author_user_id, text) VALUES (?, ?, ?)"
    )
    .run(id, authorUserId, text);

  const note = db
    .prepare(
      `SELECT client_notes.id,
              client_notes.text,
              client_notes.created_at,
              client_notes.author_user_id,
              users.username as author_username,
              users.tg_id as author_tg_id
       FROM client_notes
       LEFT JOIN users ON users.id = client_notes.author_user_id
       WHERE client_notes.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json(note);
});

app.delete("/api/clients/:id/notes/:noteId", requireRole(["admin", "support", "operator"]), (req, res) => {
  const noteId = Number(req.params.noteId);
  db.prepare("DELETE FROM client_notes WHERE id = ?").run(noteId);
  res.status(204).send();
});

app.get("/api/clients/:id/addresses", (req, res) => {
  const id = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT id,
              client_user_id,
              label,
              address_text,
              entrance,
              floor,
              apartment,
              comment,
              lat,
              lng,
              is_primary,
              created_at,
              updated_at
       FROM client_addresses
       WHERE client_user_id = ?
       ORDER BY is_primary DESC, created_at DESC`
    )
    .all(id);
  res.json(rows);
});

app.post("/api/clients/:id/addresses", requireRole(["admin", "support"]), (req, res) => {
  const id = Number(req.params.id);
  const addressText = req.body.address_text;
  if (!addressText) {
    return res.status(400).json({ error: "address_text required" });
  }

  const isPrimary = req.body.is_primary ? 1 : 0;
  if (isPrimary) {
    db.prepare(
      "UPDATE client_addresses SET is_primary = 0 WHERE client_user_id = ?"
    ).run(id);
  }

  const payload = {
    client_user_id: id,
    label: req.body.label ?? null,
    address_text: addressText,
    entrance: req.body.entrance ?? null,
    floor: req.body.floor ?? null,
    apartment: req.body.apartment ?? null,
    comment: req.body.comment ?? null,
    lat: req.body.lat ?? null,
    lng: req.body.lng ?? null,
    is_primary: isPrimary,
    updated_at: nowIso()
  };

  const result = db
    .prepare(
      `INSERT INTO client_addresses
       (client_user_id, label, address_text, entrance, floor, apartment, comment, lat, lng, is_primary, updated_at)
       VALUES (@client_user_id, @label, @address_text, @entrance, @floor, @apartment, @comment, @lat, @lng, @is_primary, @updated_at)`
    )
    .run(payload);

  const row = db
    .prepare(
      `SELECT id,
              client_user_id,
              label,
              address_text,
              entrance,
              floor,
              apartment,
              comment,
              lat,
              lng,
              is_primary,
              created_at,
              updated_at
       FROM client_addresses
       WHERE id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json(row);
});

app.patch("/api/clients/:id/addresses/:addressId", requireRole(["admin", "support"]), (req, res) => {
  const id = Number(req.params.id);
  const addressId = Number(req.params.addressId);
  const address = db
    .prepare(
      "SELECT id, client_user_id, is_primary FROM client_addresses WHERE id = ?"
    )
    .get(addressId);
  if (!address || address.client_user_id !== id) {
    return res.status(404).json({ error: "Address not found" });
  }

  const isPrimary = req.body.is_primary ? 1 : 0;
  if (isPrimary) {
    db.prepare(
      "UPDATE client_addresses SET is_primary = 0 WHERE client_user_id = ?"
    ).run(id);
  }

  db.prepare(
    `UPDATE client_addresses
     SET label = COALESCE(@label, label),
         address_text = COALESCE(@address_text, address_text),
         entrance = COALESCE(@entrance, entrance),
         floor = COALESCE(@floor, floor),
         apartment = COALESCE(@apartment, apartment),
         comment = COALESCE(@comment, comment),
         lat = COALESCE(@lat, lat),
         lng = COALESCE(@lng, lng),
         is_primary = COALESCE(@is_primary, is_primary),
         updated_at = @updated_at
     WHERE id = @id`
  ).run({
    id: addressId,
    label: req.body.label ?? null,
    address_text: req.body.address_text ?? null,
    entrance: req.body.entrance ?? null,
    floor: req.body.floor ?? null,
    apartment: req.body.apartment ?? null,
    comment: req.body.comment ?? null,
    lat: req.body.lat ?? null,
    lng: req.body.lng ?? null,
    is_primary: req.body.is_primary === undefined ? null : isPrimary,
    updated_at: nowIso()
  });

  const row = db
    .prepare(
      `SELECT id,
              client_user_id,
              label,
              address_text,
              entrance,
              floor,
              apartment,
              comment,
              lat,
              lng,
              is_primary,
              created_at,
              updated_at
       FROM client_addresses
       WHERE id = ?`
    )
    .get(addressId);

  res.json(row);
});

app.delete("/api/clients/:id/addresses/:addressId", requireRole(["admin", "support"]), (req, res) => {
  const id = Number(req.params.id);
  const addressId = Number(req.params.addressId);
  db.prepare(
    "DELETE FROM client_addresses WHERE id = ? AND client_user_id = ?"
  ).run(addressId, id);
  res.status(204).send();
});

app.post("/api/clients/:id/addresses/:addressId/set-primary", requireRole(["admin", "support"]), (req, res) => {
  const id = Number(req.params.id);
  const addressId = Number(req.params.addressId);
  const address = db
    .prepare(
      "SELECT id FROM client_addresses WHERE id = ? AND client_user_id = ?"
    )
    .get(addressId, id);
  if (!address) {
    return res.status(404).json({ error: "Address not found" });
  }
  db.prepare(
    "UPDATE client_addresses SET is_primary = 0 WHERE client_user_id = ?"
  ).run(id);
  db.prepare(
    "UPDATE client_addresses SET is_primary = 1, updated_at = @updated_at WHERE id = @id"
  ).run({ updated_at: nowIso(), id: addressId });
  const row = db
    .prepare(
      `SELECT id,
              client_user_id,
              label,
              address_text,
              entrance,
              floor,
              apartment,
              comment,
              lat,
              lng,
              is_primary,
              created_at,
              updated_at
       FROM client_addresses
       WHERE id = ?`
    )
    .get(addressId);
  res.json(row);
});

app.get("/api/clients/:id/promos", (req, res) => {
  const id = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT promo_issues.id,
              promo_issues.code,
              promo_issues.type,
              promo_issues.value,
              promo_issues.min_order_amount,
              promo_issues.status,
              promo_issues.reason,
              promo_issues.issued_by_user_id,
              promo_issues.related_order_id,
              promo_issues.issued_at,
              promo_issues.expires_at,
              promo_issues.used_at,
              promo_issues.revoked_at,
              promo_issues.revoked_by_user_id,
              users.username as issued_by_username
       FROM promo_issues
       LEFT JOIN users ON users.id = promo_issues.issued_by_user_id
       WHERE promo_issues.client_user_id = ?
       ORDER BY promo_issues.issued_at DESC`
    )
    .all(id);
  res.json(rows);
});

app.post("/api/clients/:id/promos/issue", requireRole(["admin", "support"]), (req, res) => {
  const id = Number(req.params.id);
  const type = req.body.type;
  const value = req.body.value;
  const reason = req.body.reason;
  if (!type || !value || !reason) {
    return res.status(400).json({ error: "type, value, reason required" });
  }

  const actorId = getActorId(req);
  if (!actorId) {
    return res.status(400).json({ error: "issued_by_user_id required" });
  }

  let code = req.body.code ?? null;
  let attempts = 0;
  while (!code && attempts < 5) {
    const candidate = generatePromoCode();
    const exists = db
      .prepare("SELECT id FROM promo_issues WHERE code = ?")
      .get(candidate);
    if (!exists) {
      code = candidate;
    }
    attempts += 1;
  }
  if (!code) {
    return res.status(500).json({ error: "Failed to generate code" });
  }

  const payload = {
    client_user_id: id,
    code,
    type,
    value: Number(value),
    min_order_amount: req.body.minOrderAmount ?? null,
    status: "active",
    reason,
    issued_by_user_id: actorId,
    related_order_id: req.body.relatedOrderId ?? null,
    issued_at: nowIso(),
    expires_at: req.body.expiresAt ?? null
  };

  const result = db
    .prepare(
      `INSERT INTO promo_issues
       (client_user_id, code, type, value, min_order_amount, status, reason, issued_by_user_id, related_order_id, issued_at, expires_at)
       VALUES (@client_user_id, @code, @type, @value, @min_order_amount, @status, @reason, @issued_by_user_id, @related_order_id, @issued_at, @expires_at)`
    )
    .run(payload);

  const row = db
    .prepare(
      `SELECT promo_issues.id,
              promo_issues.code,
              promo_issues.type,
              promo_issues.value,
              promo_issues.min_order_amount,
              promo_issues.status,
              promo_issues.reason,
              promo_issues.issued_by_user_id,
              promo_issues.related_order_id,
              promo_issues.issued_at,
              promo_issues.expires_at,
              promo_issues.used_at,
              promo_issues.revoked_at,
              promo_issues.revoked_by_user_id,
              users.username as issued_by_username
       FROM promo_issues
       LEFT JOIN users ON users.id = promo_issues.issued_by_user_id
       WHERE promo_issues.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json(row);
});

app.post("/api/clients/:id/promos/:promoIssueId/revoke", requireRole(["admin", "support"]), (req, res) => {
  const clientId = Number(req.params.id);
  const promoIssueId = Number(req.params.promoIssueId);
  const promo = db
    .prepare(
      "SELECT id, status FROM promo_issues WHERE id = ? AND client_user_id = ?"
    )
    .get(promoIssueId, clientId);
  if (!promo) {
    return res.status(404).json({ error: "Promo issue not found" });
  }
  if (promo.status === "used") {
    return res.status(400).json({ error: "Cannot revoke used promo" });
  }
  db.prepare(
    `UPDATE promo_issues
     SET status = 'revoked',
         revoked_at = @revoked_at,
         revoked_by_user_id = @revoked_by_user_id
     WHERE id = @id`
  ).run({
    revoked_at: nowIso(),
    revoked_by_user_id: getActorId(req),
    id: promoIssueId
  });

  res.json({ id: promoIssueId, status: "revoked" });
});

app.get("/api/search", (req, res) => {
  const qRaw = String(req.query.q || "").trim();
  if (!qRaw) {
    return res.json({ users: [], clients: [], orders: [] });
  }

  const q = `%${qRaw}%`;
  const qStart = `${qRaw}%`;

  const users = db
    .prepare(
      `SELECT id, tg_id as tgId, username, role
       FROM users
       WHERE tg_id LIKE @q OR username LIKE @q
       ORDER BY CASE
         WHEN tg_id = @exact OR username = @exact THEN 1
         WHEN tg_id LIKE @qStart OR username LIKE @qStart THEN 2
         ELSE 3
       END, id DESC
       LIMIT 5`
    )
    .all({ q, qStart, exact: qRaw });

  const clients = db
    .prepare(
      `SELECT clients.user_id as id, clients.full_name as name, clients.phone as phone
       FROM clients
       WHERE clients.full_name LIKE @q OR clients.phone LIKE @q
       ORDER BY CASE
         WHEN clients.full_name = @exact OR clients.phone = @exact THEN 1
         WHEN clients.full_name LIKE @qStart OR clients.phone LIKE @qStart THEN 2
         ELSE 3
       END, clients.user_id DESC
       LIMIT 5`
    )
    .all({ q, qStart, exact: qRaw });

  const orders = db
    .prepare(
      `SELECT id, order_number as orderId, total_amount as amount, status
       FROM orders
       WHERE order_number LIKE @q
       ORDER BY CASE
         WHEN order_number = @exact THEN 1
         WHEN order_number LIKE @qStart THEN 2
         ELSE 3
       END, created_at DESC
       LIMIT 5`
    )
    .all({ q, qStart, exact: qRaw });

  return res.json({ users, clients, orders });
});

app.get("/api/partners/list", (req, res) => {
  const { q, status } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause:
        "(partners.name LIKE @q OR partners.manager LIKE @q OR partners.contact_name LIKE @q OR partners.email LIKE @q OR partners.phone_primary LIKE @q)",
      paramName: "q"
    },
    { value: status, clause: "partners.status = @status", paramName: "status" }
  ]);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const count = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM partners
       ${where}`
    )
    .get(params).count;
  const items = db
    .prepare(
      `SELECT partners.id,
              partners.name,
              partners.manager,
              partners.status,
              partners.contact_name,
              partners.phone_primary,
              partners.email,
              COALESCE(outlets_count.count, 0) as outlets_count
       FROM partners
       LEFT JOIN (
         SELECT partner_id, COUNT(*) as count
         FROM outlets
         GROUP BY partner_id
       ) outlets_count ON outlets_count.partner_id = partners.id
       ${where}
       ORDER BY partners.id DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });
  res.json({ items, page, limit, total: count });
});

app.get("/api/partners", (_req, res) => {
  const { q } = _req.query;
  let sql =
    "SELECT id, name, manager, status, contact_name, phone_primary, email FROM partners";
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause:
        "(name LIKE @q OR manager LIKE @q OR contact_name LIKE @q OR email LIKE @q OR phone_primary LIKE @q)",
      paramName: "q"
    }
  ]);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY id";
  res.json(db.prepare(sql).all(params));
});

app.post("/api/partners", requireRole(["admin", "operator"]), (req, res) => {
  const result = createPartnerStmt.run({
    name: req.body.name,
    manager: req.body.manager ?? null,
    status: req.body.status ?? "active",
    contact_name: req.body.contact_name ?? null,
    phone_primary: req.body.phone_primary ?? null,
    phone_secondary: req.body.phone_secondary ?? null,
    phone_tertiary: req.body.phone_tertiary ?? null,
    email: req.body.email ?? null
  });
  const partner = db
    .prepare(
      "SELECT id, name, manager, status, contact_name, phone_primary, phone_secondary, phone_tertiary, email FROM partners WHERE id = ?"
    )
    .get(result.lastInsertRowid);
  logAudit({
    entity_type: "partner",
    entity_id: partner.id,
    action: "create",
    actor_id: getActorId(req),
    before: null,
    after: partner
  });
  res.status(201).json(partner);
});

app.patch("/api/partners/:id", requireRole(["admin", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const partner = db
    .prepare(
      "SELECT id, name, manager, status, contact_name, phone_primary, phone_secondary, phone_tertiary, email FROM partners WHERE id = ?"
    )
    .get(id);
  if (!partner) {
    return res.status(404).json({ error: "Partner not found" });
  }
  updatePartnerStmt.run({
    id,
    name: req.body.name ?? null,
    manager: req.body.manager ?? null,
    status: req.body.status ?? null,
    contact_name: req.body.contact_name ?? null,
    phone_primary: req.body.phone_primary ?? null,
    phone_secondary: req.body.phone_secondary ?? null,
    phone_tertiary: req.body.phone_tertiary ?? null,
    email: req.body.email ?? null
  });
  const updated = db
    .prepare(
      "SELECT id, name, manager, status, contact_name, phone_primary, phone_secondary, phone_tertiary, email FROM partners WHERE id = ?"
    )
    .get(id);
  logAudit({
    entity_type: "partner",
    entity_id: id,
    action: "update",
    actor_id: getActorId(req),
    before: partner,
    after: updated
  });
  res.json(updated);
});

app.delete("/api/partners/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const partner = db
    .prepare("SELECT id, name, manager, status FROM partners WHERE id = ?")
    .get(id);
  deletePartnerStmt.run(id);
  if (partner) {
    logAudit({
      entity_type: "partner",
      entity_id: id,
      action: "delete",
      actor_id: getActorId(req),
      before: partner,
      after: null
    });
  }
  res.status(204).send();
});

app.get("/api/partners/:id", (req, res) => {
  const id = Number(req.params.id);
  const partner = db
    .prepare(
      `SELECT partners.id,
              partners.name,
              partners.manager,
              partners.status,
              partners.contact_name,
              partners.phone_primary,
              partners.phone_secondary,
              partners.phone_tertiary,
              partners.email,
              COALESCE(outlets_count.count, 0) as outlets_count
       FROM partners
       LEFT JOIN (
         SELECT partner_id, COUNT(*) as count
         FROM outlets
         GROUP BY partner_id
       ) outlets_count ON outlets_count.partner_id = partners.id
       WHERE partners.id = ?`
    )
    .get(id);
  if (!partner) {
    return res.status(404).json({ error: "Partner not found" });
  }
  res.json(partner);
});

app.get("/api/partners/:id/outlets", (req, res) => {
  const id = Number(req.params.id);
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const count = db
    .prepare("SELECT COUNT(*) as count FROM outlets WHERE partner_id = ?")
    .get(id).count;
  const items = db
    .prepare(
      `SELECT outlets.id,
              outlets.partner_id,
              outlets.type,
              outlets.name,
              outlets.address,
              outlets.is_active,
              outlets.status,
              outlets.hours,
              outlets.delivery_zone,
              outlets.phone,
              outlets.email,
              outlets.address_comment,
              outlets.status_reason,
              outlets.status_updated_at
       FROM outlets
       WHERE partner_id = @partner_id
       ORDER BY outlets.id DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ partner_id: id, limit, offset });
  res.json({ items, page, limit, total: count });
});

app.get("/api/partners/:id/notes", (req, res) => {
  const id = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT entity_notes.id,
              entity_notes.text,
              entity_notes.created_at,
              entity_notes.author_user_id,
              users.username as author_username,
              users.tg_id as author_tg_id
       FROM entity_notes
       LEFT JOIN users ON users.id = entity_notes.author_user_id
       WHERE entity_notes.entity_type = 'partner' AND entity_notes.entity_id = ?
       ORDER BY entity_notes.created_at DESC`
    )
    .all(id);
  res.json(rows);
});

app.post("/api/partners/:id/notes", requireRole(["admin", "support", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const text = req.body.text;
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }
  const authorId = getActorId(req);
  const result = db
    .prepare(
      "INSERT INTO entity_notes (entity_type, entity_id, author_user_id, text) VALUES ('partner', ?, ?, ?)"
    )
    .run(id, authorId, text);
  const note = db
    .prepare(
      `SELECT entity_notes.id,
              entity_notes.text,
              entity_notes.created_at,
              entity_notes.author_user_id,
              users.username as author_username,
              users.tg_id as author_tg_id
       FROM entity_notes
       LEFT JOIN users ON users.id = entity_notes.author_user_id
       WHERE entity_notes.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json(note);
});

app.delete("/api/partners/:id/notes/:noteId", requireRole(["admin", "support", "operator"]), (req, res) => {
  const noteId = Number(req.params.noteId);
  db.prepare("DELETE FROM entity_notes WHERE id = ?").run(noteId);
  res.status(204).send();
});

app.get("/api/partners/:id/finance", (req, res) => {
  const id = Number(req.params.id);
  const partner = db.prepare("SELECT id FROM partners WHERE id = ?").get(id);
  if (!partner) {
    return res.status(404).json({ error: "Partner not found" });
  }

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(orders.subtotal_food), 0) as turnover,
         COALESCE(SUM(orders.restaurant_commission), 0) as commission,
         COALESCE(SUM(orders.restaurant_penalty), 0) as penalties
       FROM orders
       JOIN outlets ON outlets.id = orders.outlet_id
       WHERE outlets.partner_id = ?`
    )
    .get(id);
  const payouts = Math.max(
    0,
    Number(totals.turnover || 0) -
      Number(totals.commission || 0) -
      Number(totals.penalties || 0)
  );

  const ledger = db
    .prepare(
      `SELECT id, title, amount, status, type, created_at, order_id, balance_delta, category
       FROM finance_ledger
       WHERE partner_id = ?
       ORDER BY created_at DESC`
    )
    .all(id);

  res.json({
    summary: [
      { type: "turnover", value: totals.turnover },
      { type: "commission", value: totals.commission },
      { type: "payouts", value: payouts }
    ],
    transactions: ledger
  });
});

app.get("/api/outlets", (_req, res) => {
  const { q, type, partner_id } = _req.query;
  const partnerIdNumber = partner_id ? Number(partner_id) : null;
  let sql =
    "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone, phone, email, address_comment, status_reason, status_updated_at FROM outlets";
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "(name LIKE @q OR address LIKE @q)",
      paramName: "q"
    },
    { value: type, clause: "type = @type", paramName: "type" },
    {
      value:
        partnerIdNumber !== null && !Number.isNaN(partnerIdNumber)
          ? partnerIdNumber
          : null,
      clause: "partner_id = @partner_id",
      paramName: "partner_id"
    }
  ]);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY id";
  res.json(db.prepare(sql).all(params));
});

app.get("/api/outlets/list", (req, res) => {
  const { q, type, partner_id, status } = req.query;
  const partnerIdNumber = partner_id ? Number(partner_id) : null;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "(outlets.name LIKE @q OR outlets.address LIKE @q)",
      paramName: "q"
    },
    { value: type, clause: "outlets.type = @type", paramName: "type" },
    {
      value:
        partnerIdNumber !== null && !Number.isNaN(partnerIdNumber)
          ? partnerIdNumber
          : null,
      clause: "outlets.partner_id = @partner_id",
      paramName: "partner_id"
    },
    { value: status, clause: "outlets.status = @status", paramName: "status" }
  ]);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const count = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM outlets
       ${where}`
    )
    .get(params).count;
  const items = db
    .prepare(
      `SELECT outlets.id,
              outlets.partner_id,
              outlets.type,
              outlets.name,
              outlets.address,
              outlets.is_active,
              outlets.status,
              outlets.hours,
              outlets.delivery_zone,
              outlets.phone,
              outlets.email,
              outlets.address_comment,
              outlets.status_reason,
              outlets.status_updated_at,
              partners.name as partner_name
       FROM outlets
       LEFT JOIN partners ON partners.id = outlets.partner_id
       ${where}
       ORDER BY outlets.id DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });
  res.json({ items, page, limit, total: count });
});

app.post("/api/outlets", requireRole(["admin", "operator"]), (req, res) => {
  const payload = {
    partner_id: req.body.partner_id,
    type: req.body.type,
    name: req.body.name,
    address: req.body.address ?? "-",
    is_active: req.body.is_active ?? 1,
    status: req.body.status ?? "open",
    hours: req.body.hours ?? null,
    delivery_zone: req.body.delivery_zone ?? null,
    phone: req.body.phone ?? null,
    email: req.body.email ?? null,
    address_comment: req.body.address_comment ?? null,
    status_reason: req.body.status_reason ?? null,
    status_updated_at: req.body.status ? new Date().toISOString() : null
  };
  const result = createOutletStmt.run(payload);
  const outlet = db
    .prepare(
      "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone, phone, email, address_comment, status_reason, status_updated_at FROM outlets WHERE id = ?"
    )
    .get(result.lastInsertRowid);
  logAudit({
    entity_type: "outlet",
    entity_id: outlet.id,
    action: "create",
    actor_id: getActorId(req),
    before: null,
    after: outlet
  });
  res.status(201).json(outlet);
});

app.patch("/api/outlets/:id", requireRole(["admin", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const outlet = db
    .prepare(
      "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone, phone, email, address_comment, status_reason, status_updated_at FROM outlets WHERE id = ?"
    )
    .get(id);
  if (!outlet) {
    return res.status(404).json({ error: "Outlet not found" });
  }
  const nextStatus = req.body.status ?? null;
  if (nextStatus === "closed" && !req.body.status_reason) {
    return res.status(400).json({ error: "status_reason required" });
  }
  updateOutletStmt.run({
    id,
    partner_id: req.body.partner_id ?? null,
    type: req.body.type ?? null,
    name: req.body.name ?? null,
    address: req.body.address ?? null,
    is_active: req.body.is_active ?? null,
    status: nextStatus,
    hours: req.body.hours ?? null,
    delivery_zone: req.body.delivery_zone ?? null,
    phone: req.body.phone ?? null,
    email: req.body.email ?? null,
    address_comment: req.body.address_comment ?? null,
    status_reason:
      nextStatus === "closed" ? req.body.status_reason : nextStatus ? "" : null,
    status_updated_at: nextStatus ? new Date().toISOString() : null
  });
  const updated = db
    .prepare(
      "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone, phone, email, address_comment, status_reason, status_updated_at FROM outlets WHERE id = ?"
    )
    .get(id);
  logAudit({
    entity_type: "outlet",
    entity_id: id,
    action: "update",
    actor_id: getActorId(req),
    before: outlet,
    after: updated
  });
  res.json(updated);
});

app.delete("/api/outlets/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const outlet = db
    .prepare(
      "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone, phone, email, address_comment, status_reason, status_updated_at FROM outlets WHERE id = ?"
    )
    .get(id);
  deleteOutletStmt.run(id);
  if (outlet) {
    logAudit({
      entity_type: "outlet",
      entity_id: id,
      action: "delete",
      actor_id: getActorId(req),
      before: outlet,
      after: null
    });
  }
  res.status(204).send();
});

app.get("/api/outlets/:id", (req, res) => {
  const id = Number(req.params.id);
  const outlet = db
    .prepare(
      `SELECT outlets.id,
              outlets.partner_id,
              outlets.type,
              outlets.name,
              outlets.address,
              outlets.is_active,
              outlets.status,
              outlets.hours,
              outlets.delivery_zone,
              outlets.phone,
              outlets.email,
              outlets.address_comment,
              outlets.status_reason,
              outlets.status_updated_at,
              partners.name as partner_name
       FROM outlets
       LEFT JOIN partners ON partners.id = outlets.partner_id
       WHERE outlets.id = ?`
    )
    .get(id);
  if (!outlet) {
    return res.status(404).json({ error: "Outlet not found" });
  }
  res.json(outlet);
});

app.get("/api/outlets/:id/orders", (req, res) => {
  const id = Number(req.params.id);
  const { q, status } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "orders.order_number LIKE @q",
      paramName: "q"
    },
    { value: status, clause: "orders.status = @status", paramName: "status" }
  ]);
  const where = ["orders.outlet_id = @outlet_id", ...conditions].join(" AND ");
  const count = db
    .prepare(`SELECT COUNT(*) as count FROM orders WHERE ${where}`)
    .get({ ...params, outlet_id: id }).count;
  const items = db
    .prepare(
      `SELECT orders.id,
              orders.order_number,
              orders.created_at,
              orders.status,
              orders.total_amount,
              orders.delivery_address,
              orders.courier_user_id,
              clients.phone as client_phone,
              clients.full_name as client_name
       FROM orders
       LEFT JOIN clients ON clients.user_id = orders.client_user_id
       WHERE ${where}
       ORDER BY orders.created_at DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, outlet_id: id, limit, offset });
  res.json({ items, page, limit, total: count });
});

app.get("/api/outlets/:id/notes", (req, res) => {
  const id = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT entity_notes.id,
              entity_notes.text,
              entity_notes.created_at,
              entity_notes.author_user_id,
              users.username as author_username,
              users.tg_id as author_tg_id
       FROM entity_notes
       LEFT JOIN users ON users.id = entity_notes.author_user_id
       WHERE entity_notes.entity_type = 'outlet' AND entity_notes.entity_id = ?
       ORDER BY entity_notes.created_at DESC`
    )
    .all(id);
  res.json(rows);
});

app.post("/api/outlets/:id/notes", requireRole(["admin", "support", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const text = req.body.text;
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }
  const authorId = getActorId(req);
  const result = db
    .prepare(
      "INSERT INTO entity_notes (entity_type, entity_id, author_user_id, text) VALUES ('outlet', ?, ?, ?)"
    )
    .run(id, authorId, text);
  const note = db
    .prepare(
      `SELECT entity_notes.id,
              entity_notes.text,
              entity_notes.created_at,
              entity_notes.author_user_id,
              users.username as author_username,
              users.tg_id as author_tg_id
       FROM entity_notes
       LEFT JOIN users ON users.id = entity_notes.author_user_id
       WHERE entity_notes.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json(note);
});

app.delete("/api/outlets/:id/notes/:noteId", requireRole(["admin", "support", "operator"]), (req, res) => {
  const noteId = Number(req.params.noteId);
  db.prepare("DELETE FROM entity_notes WHERE id = ?").run(noteId);
  res.status(204).send();
});

app.get("/api/outlets/:outletId/items", (req, res) => {
  const outletId = Number(req.params.outletId);
  const { search, available } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const offset = (page - 1) * limit;
  const sort = String(req.query.sort || "title:asc");

  db.prepare(
    `UPDATE outlet_items
     SET stoplist_active = 0,
         stoplist_until = NULL,
         stoplist_reason = NULL,
         is_available = 1,
         unavailable_reason = NULL,
         unavailable_until = NULL,
         updated_at = @updated_at
     WHERE outlet_id = @outlet_id
       AND stoplist_active = 1
       AND stoplist_until IS NOT NULL
       AND datetime(stoplist_until) <= datetime('now')`
  ).run({ outlet_id: outletId, updated_at: nowIso() });

  const { conditions, params } = buildFilters([
    {
      value: search ? `%${search}%` : null,
      clause: "(items.title LIKE @search OR items.sku LIKE @search)",
      paramName: "search"
    },
    {
      value:
        available === undefined || available === ""
          ? null
          : available === "true"
            ? 1
            : 0,
      clause: "outlet_items.is_available = @available",
      paramName: "available"
    }
  ]);
  const where = [
    "outlet_items.outlet_id = @outlet_id",
    ...conditions
  ].join(" AND ");

  const rows = db
    .prepare(
      `SELECT items.id as item_id,
              items.title,
              items.short_title,
              items.category,
              items.sku,
              items.description,
              items.photo_url,
              items.image_url,
              items.image_enabled,
              items.priority,
              items.categories,
              items.is_adult,
              items.kcal,
              items.protein,
              items.fat,
              items.carbs,
              items.core_id,
              items.origin_id,
              items.weight_grams,
              outlet_items.base_price,
              outlet_items.is_available,
              outlet_items.stock,
              outlet_items.stock_qty,
              outlet_items.is_visible,
              outlet_items.unavailable_reason,
              outlet_items.unavailable_until,
              outlet_items.stoplist_active,
              outlet_items.stoplist_until,
              outlet_items.stoplist_reason,
              outlet_items.delivery_methods,
              outlet_items.updated_at
       FROM outlet_items
       JOIN items ON items.id = outlet_items.item_id
       WHERE ${where}`
    )
    .all({ ...params, outlet_id: outletId });

  const campaigns = db
    .prepare(
      `SELECT outlet_campaign_items.item_id,
              outlet_campaign_items.discount_type,
              outlet_campaign_items.discount_value,
              outlet_campaigns.id as campaign_id,
              outlet_campaigns.title
       FROM outlet_campaign_items
       JOIN outlet_campaigns ON outlet_campaigns.id = outlet_campaign_items.campaign_id
       WHERE outlet_campaigns.outlet_id = @outlet_id
         AND outlet_campaigns.status = 'active'
         AND (outlet_campaigns.start_at IS NULL OR outlet_campaigns.start_at <= datetime('now'))
         AND (outlet_campaigns.end_at IS NULL OR outlet_campaigns.end_at >= datetime('now'))`
    )
    .all({ outlet_id: outletId });

  const campaignByItem = campaigns.reduce((acc, row) => {
    if (!acc[row.item_id]) {
      acc[row.item_id] = row;
    }
    return acc;
  }, {});

  const mapped = rows.map((row) => {
    const campaign = campaignByItem[row.item_id];
    const basePrice = Number(row.base_price || 0);
    const stoplistActive = Number(row.stoplist_active) === 1;
    const unavailableReason = stoplistActive ? row.stoplist_reason : row.unavailable_reason;
    const unavailableUntil = stoplistActive ? row.stoplist_until : row.unavailable_until;
    const stockQty = row.stock_qty ?? row.stock;
    return {
      itemId: row.item_id,
      title: row.title,
      shortTitle: row.short_title,
      category: row.category,
      sku: row.sku,
      description: row.description,
      photoUrl: row.photo_url,
      imageUrl: row.image_url || row.photo_url,
      imageEnabled: Number(row.image_enabled ?? 1) === 1,
      weightGrams: row.weight_grams,
      priority: row.priority ?? 0,
      categories: parseJsonSafe(row.categories, []),
      isAdult: Number(row.is_adult ?? 0) === 1,
      isVisible: Number(row.is_visible ?? 1) === 1,
      stoplistActive,
      stoplistUntil: row.stoplist_until,
      stoplistReason: row.stoplist_reason,
      deliveryMethods: parseJsonSafe(row.delivery_methods, []),
      kcal: row.kcal,
      protein: row.protein,
      fat: row.fat,
      carbs: row.carbs,
      coreId: row.core_id,
      originId: row.origin_id,
      basePrice,
      currentPrice: computeCurrentPrice(basePrice, campaign),
      isAvailable: row.is_available,
      stock: stockQty,
      stockQty,
      unavailableReason,
      unavailableUntil,
      updatedAt: row.updated_at,
      activeCampaign: campaign
        ? {
            campaignId: campaign.campaign_id,
            title: campaign.title,
            discount_type: campaign.discount_type,
            discount_value: campaign.discount_value
          }
        : null
    };
  });

  const sortField = sort.split(":")[0];
  const sortDir = sort.split(":")[1] === "desc" ? -1 : 1;
  mapped.sort((a, b) => {
    if (sortField === "current_price") {
      return (a.currentPrice - b.currentPrice) * sortDir;
    }
    if (sortField === "updatedAt") {
      return (String(a.updatedAt || "").localeCompare(String(b.updatedAt || ""))) * sortDir;
    }
    return (String(a.title || "").localeCompare(String(b.title || ""))) * sortDir;
  });

  const paged = mapped.slice(offset, offset + limit);
  res.json({
    items: paged,
    pageInfo: {
      page,
      limit,
      total: mapped.length
    }
  });
});

app.post("/api/outlets/:outletId/items", requireRole(["admin"]), (req, res) => {
  const outletId = Number(req.params.outletId);
  const {
    title,
    shortTitle,
    sku,
    category,
    categories,
    description,
    photoUrl,
    imageUrl,
    imageEnabled,
    weightGrams,
    priority,
    isAdult,
    kcal,
    protein,
    fat,
    carbs,
    coreId,
    originId,
    basePrice,
    stock,
    stockQty,
    isAvailable,
    isVisible,
    deliveryMethods,
    stoplistActive,
    stoplistReason,
    stoplistUntil,
    unavailableReason,
    unavailableUntil
  } = req.body;

  if (!title || basePrice === undefined || basePrice === null) {
    return res.status(400).json({ error: "Title and base price are required" });
  }

  const categoriesValue = normalizeJsonArrayInput(categories);
  const deliveryMethodsValue = normalizeJsonArrayInput(deliveryMethods);
  const imageUrlValue = imageUrl ?? photoUrl ?? null;
  const photoUrlValue = photoUrl ?? imageUrl ?? null;

  const itemId = db.prepare(
    `INSERT INTO items
      (title, short_title, sku, category, categories, description, photo_url, image_url, image_enabled,
       weight_grams, priority, is_adult, kcal, protein, fat, carbs, core_id, origin_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    title,
    shortTitle ?? null,
    sku ?? null,
    category ?? null,
    categoriesValue,
    description ?? null,
    photoUrlValue,
    imageUrlValue,
    imageEnabled === undefined ? 1 : imageEnabled ? 1 : 0,
    weightGrams ? Number(weightGrams) : 0,
    priority === undefined || priority === "" ? 0 : Number(priority),
    isAdult ? 1 : 0,
    kcal === undefined || kcal === "" ? null : Number(kcal),
    protein === undefined || protein === "" ? null : Number(protein),
    fat === undefined || fat === "" ? null : Number(fat),
    carbs === undefined || carbs === "" ? null : Number(carbs),
    coreId ?? null,
    originId ?? null,
    nowIso()
  ).lastInsertRowid;

  const availableValue = isAvailable === undefined ? 1 : isAvailable ? 1 : 0;
  const stoplistValue = stoplistActive ? 1 : 0;
  const stockValue =
    stockQty !== undefined
      ? stockQty === "" || stockQty === null
        ? null
        : Number(stockQty)
      : stock === undefined || stock === ""
        ? null
        : Number(stock);

  if (stoplistValue === 1 && (!stoplistReason || String(stoplistReason).trim() === "")) {
    return res.status(400).json({ error: "Stoplist reason is required" });
  }

  if (availableValue === 0 && !stoplistValue && !unavailableReason) {
    return res.status(400).json({ error: "Unavailable reason is required" });
  }

  db.prepare(
    `INSERT INTO outlet_items
      (outlet_id, item_id, base_price, is_available, stock, stock_qty, is_visible,
       stoplist_active, stoplist_reason, stoplist_until, delivery_methods,
       unavailable_reason, unavailable_until, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    outletId,
    itemId,
    Number(basePrice),
    stoplistValue ? 0 : availableValue,
    stockValue,
    stockValue,
    isVisible === undefined ? 1 : isVisible ? 1 : 0,
    stoplistValue,
    stoplistValue ? stoplistReason ?? null : null,
    stoplistValue ? stoplistUntil ?? null : null,
    deliveryMethodsValue,
    stoplistValue ? stoplistReason ?? null : unavailableReason ?? null,
    stoplistValue ? stoplistUntil ?? null : unavailableUntil ?? null,
    nowIso()
  );

  const created = db.prepare(
    `SELECT items.id as item_id,
            items.title,
            items.short_title,
            items.category,
            items.sku,
            items.description,
            items.photo_url,
            items.image_url,
            items.image_enabled,
            items.priority,
            items.categories,
            items.is_adult,
            items.kcal,
            items.protein,
            items.fat,
            items.carbs,
            items.core_id,
            items.origin_id,
            items.weight_grams,
            outlet_items.base_price,
            outlet_items.is_available,
            outlet_items.stock,
            outlet_items.stock_qty,
            outlet_items.is_visible,
            outlet_items.unavailable_reason,
            outlet_items.unavailable_until,
            outlet_items.stoplist_active,
            outlet_items.stoplist_until,
            outlet_items.stoplist_reason,
            outlet_items.delivery_methods,
            outlet_items.updated_at
     FROM outlet_items
     JOIN items ON items.id = outlet_items.item_id
     WHERE outlet_items.outlet_id = ? AND outlet_items.item_id = ?`
  ).get(outletId, itemId);

  logAudit({
    entity_type: "item",
    entity_id: itemId,
    action: "create",
    actor_id: getActorId(req),
    before: null,
    after: { outlet_id: outletId, ...created }
  });

  res.status(201).json(created);
});

app.get("/api/outlets/:outletId/items/:itemId", (req, res) => {
  const outletId = Number(req.params.outletId);
  const itemId = Number(req.params.itemId);

  db.prepare(
    `UPDATE outlet_items
     SET stoplist_active = 0,
         stoplist_until = NULL,
         stoplist_reason = NULL,
         is_available = 1,
         unavailable_reason = NULL,
         unavailable_until = NULL,
         updated_at = @updated_at
     WHERE outlet_id = @outlet_id
       AND item_id = @item_id
       AND stoplist_active = 1
       AND stoplist_until IS NOT NULL
       AND datetime(stoplist_until) <= datetime('now')`
  ).run({ outlet_id: outletId, item_id: itemId, updated_at: nowIso() });

  const profile = fetchItemProfile(db, outletId, itemId);
  if (!profile) {
    return res.status(404).json({ error: "Outlet item not found" });
  }
  res.json(profile);
});

app.patch("/api/outlets/:outletId/items/:itemId", (req, res) => {
  const outletId = Number(req.params.outletId);
  const itemId = Number(req.params.itemId);
  const role = getRole(req);

  const outletItem = db
    .prepare(
      `SELECT outlet_items.base_price,
              outlet_items.is_available,
              outlet_items.stock,
              outlet_items.stock_qty,
              outlet_items.is_visible,
              outlet_items.unavailable_reason,
              outlet_items.unavailable_until,
              outlet_items.stoplist_active,
              outlet_items.stoplist_until,
              outlet_items.stoplist_reason,
              outlet_items.delivery_methods,
              items.title,
              items.short_title,
              items.category,
              items.categories,
              items.sku,
              items.description,
              items.photo_url,
              items.image_url,
              items.image_enabled,
              items.weight_grams
              , items.priority
              , items.is_adult
              , items.kcal
              , items.protein
              , items.fat
              , items.carbs
              , items.core_id
              , items.origin_id
       FROM outlet_items
       JOIN items ON items.id = outlet_items.item_id
       WHERE outlet_items.outlet_id = ? AND outlet_items.item_id = ?`
    )
    .get(outletId, itemId);
  if (!outletItem) {
    return res.status(404).json({ error: "Outlet item not found" });
  }

  const canEditPrice = role === "admin";
  const canEditAvailability = role === "admin" || role === "operator";
  const canEditDetails = role === "admin";

  const detailsFields = [
    "title",
    "shortTitle",
    "category",
    "categories",
    "sku",
    "description",
    "photoUrl",
    "imageUrl",
    "imageEnabled",
    "weightGrams",
    "priority",
    "isAdult",
    "kcal",
    "protein",
    "fat",
    "carbs",
    "coreId",
    "originId"
  ];
  if (detailsFields.some((field) => req.body[field] !== undefined) && !canEditDetails) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.body.basePrice !== undefined && !canEditPrice) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const availabilityFields = [
    "isAvailable",
    "stock",
    "stockQty",
    "unavailableReason",
    "unavailableUntil",
    "isVisible",
    "deliveryMethods",
    "stoplistActive",
    "stoplistReason",
    "stoplistUntil"
  ];
  if (availabilityFields.some((field) => req.body[field] !== undefined) && !canEditAvailability) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const newBasePrice =
    req.body.basePrice !== undefined ? Number(req.body.basePrice) : null;
  const isAvailableProvided = req.body.isAvailable !== undefined;
  let isAvailable =
    isAvailableProvided ? (req.body.isAvailable ? 1 : 0) : null;
  const stockProvided = req.body.stock !== undefined || req.body.stockQty !== undefined;
  const stockValue =
    req.body.stockQty !== undefined
      ? req.body.stockQty === "" || req.body.stockQty === null
        ? null
        : Number(req.body.stockQty)
      : req.body.stock !== undefined
        ? req.body.stock === "" || req.body.stock === null
          ? null
          : Number(req.body.stock)
        : null;
  const isVisibleProvided = req.body.isVisible !== undefined;
  const isVisible = isVisibleProvided ? (req.body.isVisible ? 1 : 0) : null;
  const stoplistProvided = req.body.stoplistActive !== undefined;
  const stoplistActive = stoplistProvided ? (req.body.stoplistActive ? 1 : 0) : null;
  const stoplistReasonProvided = req.body.stoplistReason !== undefined;
  const stoplistUntilProvided = req.body.stoplistUntil !== undefined;
  const deliveryMethodsProvided = req.body.deliveryMethods !== undefined;
  const deliveryMethodsValue = normalizeJsonArrayInput(req.body.deliveryMethods);
  const reasonProvided = req.body.unavailableReason !== undefined;
  const untilProvided = req.body.unavailableUntil !== undefined;

  let stoplistReason = stoplistReasonProvided
    ? req.body.stoplistReason
    : outletItem.stoplist_reason;
  let stoplistUntil = stoplistUntilProvided
    ? req.body.stoplistUntil
    : outletItem.stoplist_until;
  let unavailableReason = reasonProvided
    ? req.body.unavailableReason
    : outletItem.unavailable_reason;
  let unavailableUntil = untilProvided
    ? req.body.unavailableUntil
    : outletItem.unavailable_until;

  if (stoplistProvided && stoplistActive === 1) {
    if (!stoplistReason || String(stoplistReason).trim() === "") {
      return res.status(400).json({ error: "Stoplist reason is required" });
    }
    isAvailable = 0;
    unavailableReason = stoplistReason;
    unavailableUntil = stoplistUntil;
  }

  if (stoplistProvided && stoplistActive === 0) {
    stoplistReason = null;
    stoplistUntil = null;
  }

  if (isAvailableProvided && isAvailable === 1) {
    unavailableReason = null;
    unavailableUntil = null;
  }

  if (isAvailableProvided && isAvailable === 0 && (!stoplistProvided || stoplistActive === 0)) {
    if (!unavailableReason || String(unavailableReason).trim() === "") {
      return res.status(400).json({ error: "Unavailable reason is required" });
    }
  }

  if (canEditDetails && detailsFields.some((field) => req.body[field] !== undefined)) {
    const categoriesValue = normalizeJsonArrayInput(req.body.categories);
    const imageUrlValue =
      req.body.imageUrl !== undefined
        ? req.body.imageUrl
        : req.body.photoUrl !== undefined
          ? req.body.photoUrl
          : null;
    const photoUrlValue =
      req.body.photoUrl !== undefined
        ? req.body.photoUrl
        : req.body.imageUrl !== undefined
          ? req.body.imageUrl
          : null;
    db.prepare(
      `UPDATE items
       SET title = COALESCE(@title, title),
           short_title = COALESCE(@short_title, short_title),
           category = COALESCE(@category, category),
           categories = COALESCE(@categories, categories),
           sku = COALESCE(@sku, sku),
           description = COALESCE(@description, description),
           photo_url = COALESCE(@photo_url, photo_url),
           image_url = COALESCE(@image_url, image_url),
           image_enabled = COALESCE(@image_enabled, image_enabled),
           weight_grams = COALESCE(@weight_grams, weight_grams),
           priority = COALESCE(@priority, priority),
           is_adult = COALESCE(@is_adult, is_adult),
           kcal = COALESCE(@kcal, kcal),
           protein = COALESCE(@protein, protein),
           fat = COALESCE(@fat, fat),
           carbs = COALESCE(@carbs, carbs),
           core_id = COALESCE(@core_id, core_id),
           origin_id = COALESCE(@origin_id, origin_id),
           updated_at = @updated_at
       WHERE id = @item_id`
    ).run({
      title: req.body.title,
      short_title: req.body.shortTitle,
      category: req.body.category,
      categories: categoriesValue,
      sku: req.body.sku,
      description: req.body.description,
      photo_url: photoUrlValue,
      image_url: imageUrlValue,
      image_enabled:
        req.body.imageEnabled !== undefined ? (req.body.imageEnabled ? 1 : 0) : null,
      weight_grams:
        req.body.weightGrams !== undefined ? Number(req.body.weightGrams) : null,
      priority:
        req.body.priority !== undefined && req.body.priority !== ""
          ? Number(req.body.priority)
          : null,
      is_adult: req.body.isAdult !== undefined ? (req.body.isAdult ? 1 : 0) : null,
      kcal: req.body.kcal !== undefined && req.body.kcal !== "" ? Number(req.body.kcal) : null,
      protein:
        req.body.protein !== undefined && req.body.protein !== ""
          ? Number(req.body.protein)
          : null,
      fat: req.body.fat !== undefined && req.body.fat !== "" ? Number(req.body.fat) : null,
      carbs: req.body.carbs !== undefined && req.body.carbs !== "" ? Number(req.body.carbs) : null,
      core_id: req.body.coreId ?? null,
      origin_id: req.body.originId ?? null,
      updated_at: nowIso(),
      item_id: itemId
    });
  }

  db.prepare(
    `UPDATE outlet_items
     SET base_price = COALESCE(@base_price, base_price),
         is_available = COALESCE(@is_available, is_available),
         stock = COALESCE(@stock, stock),
         stock_qty = COALESCE(@stock_qty, stock_qty),
         is_visible = COALESCE(@is_visible, is_visible),
         stoplist_active = COALESCE(@stoplist_active, stoplist_active),
         stoplist_reason = CASE
           WHEN @stoplist_reason_set = 1 THEN @stoplist_reason
           ELSE stoplist_reason
         END,
         stoplist_until = CASE
           WHEN @stoplist_until_set = 1 THEN @stoplist_until
           ELSE stoplist_until
         END,
         delivery_methods = COALESCE(@delivery_methods, delivery_methods),
         unavailable_reason = CASE
           WHEN @unavailable_reason_set = 1 THEN @unavailable_reason
           ELSE unavailable_reason
         END,
         unavailable_until = CASE
           WHEN @unavailable_until_set = 1 THEN @unavailable_until
           ELSE unavailable_until
         END,
         updated_at = @updated_at
     WHERE outlet_id = @outlet_id AND item_id = @item_id`
  ).run({
    base_price: newBasePrice,
    is_available: isAvailable,
    stock: stockProvided ? stockValue : null,
    stock_qty: stockProvided ? stockValue : null,
    is_visible: isVisible,
    stoplist_active: stoplistActive,
    stoplist_reason: stoplistReason,
    stoplist_until: stoplistUntil,
    stoplist_reason_set: stoplistReasonProvided || (stoplistProvided && stoplistActive === 0) ? 1 : 0,
    stoplist_until_set: stoplistUntilProvided || (stoplistProvided && stoplistActive === 0) ? 1 : 0,
    delivery_methods: deliveryMethodsProvided ? deliveryMethodsValue : null,
    unavailable_reason: unavailableReason,
    unavailable_until: unavailableUntil,
    unavailable_reason_set:
      reasonProvided || (isAvailableProvided && isAvailable === 1) || stoplistProvided ? 1 : 0,
    unavailable_until_set:
      untilProvided || (isAvailableProvided && isAvailable === 1) || stoplistProvided ? 1 : 0,
    updated_at: nowIso(),
    outlet_id: outletId,
    item_id: itemId
  });

  if (newBasePrice !== null && newBasePrice !== Number(outletItem.base_price)) {
    db.prepare(
      `INSERT INTO outlet_item_price_history
       (outlet_id, item_id, old_price, new_price, changed_by_user_id, reason)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      outletId,
      itemId,
      outletItem.base_price,
      newBasePrice,
      getActorId(req),
      req.body.reason ?? null
    );
  }

  const updated = fetchItemProfile(db, outletId, itemId);

  logAudit({
    entity_type: "item",
    entity_id: itemId,
    action: "update",
    actor_id: getActorId(req),
    before: { outlet_id: outletId, ...outletItem },
    after: { outlet_id: outletId, ...updated }
  });

  res.json(updated);
});

app.patch(
  "/api/outlets/:outletId/items/:itemId/stoplist",
  requireRole(["admin", "operator"]),
  (req, res) => {
    const outletId = Number(req.params.outletId);
    const itemId = Number(req.params.itemId);
    const { active, until, reason } = req.body || {};

    const outletItem = db
      .prepare(
        `SELECT outlet_items.base_price,
                outlet_items.is_available,
                outlet_items.stock,
                outlet_items.stock_qty,
                outlet_items.is_visible,
                outlet_items.unavailable_reason,
                outlet_items.unavailable_until,
                outlet_items.stoplist_active,
                outlet_items.stoplist_until,
                outlet_items.stoplist_reason,
                outlet_items.delivery_methods,
                items.title,
                items.short_title,
                items.category,
                items.categories,
                items.sku,
                items.description,
                items.photo_url,
                items.image_url,
                items.image_enabled,
                items.weight_grams,
                items.priority,
                items.is_adult,
                items.kcal,
                items.protein,
                items.fat,
                items.carbs,
                items.core_id,
                items.origin_id
         FROM outlet_items
         JOIN items ON items.id = outlet_items.item_id
         WHERE outlet_items.outlet_id = ? AND outlet_items.item_id = ?`
      )
      .get(outletId, itemId);

    if (!outletItem) {
      return res.status(404).json({ error: "Outlet item not found" });
    }

    const stoplistActive = active ? 1 : 0;
    if (stoplistActive === 1 && (!reason || String(reason).trim() === "")) {
      return res.status(400).json({ error: "Stoplist reason is required" });
    }

    db.prepare(
      `UPDATE outlet_items
       SET stoplist_active = @stoplist_active,
           stoplist_reason = @stoplist_reason,
           stoplist_until = @stoplist_until,
           is_available = @is_available,
           unavailable_reason = @unavailable_reason,
           unavailable_until = @unavailable_until,
           updated_at = @updated_at
       WHERE outlet_id = @outlet_id AND item_id = @item_id`
    ).run({
      stoplist_active: stoplistActive,
      stoplist_reason: stoplistActive ? reason ?? null : null,
      stoplist_until: stoplistActive ? until ?? null : null,
      is_available: stoplistActive ? 0 : 1,
      unavailable_reason: stoplistActive ? reason ?? null : null,
      unavailable_until: stoplistActive ? until ?? null : null,
      updated_at: nowIso(),
      outlet_id: outletId,
      item_id: itemId
    });

    const updated = fetchItemProfile(db, outletId, itemId);

    logAudit({
      entity_type: "item",
      entity_id: itemId,
      action: "stoplist",
      actor_id: getActorId(req),
      before: { outlet_id: outletId, ...outletItem },
      after: { outlet_id: outletId, ...updated }
    });

    res.json(updated);
  }
);

app.post("/api/outlets/:outletId/items/:itemId/duplicate", requireRole(["admin"]), (req, res) => {
  const outletId = Number(req.params.outletId);
  const itemId = Number(req.params.itemId);

  const item = db
    .prepare(
      `SELECT outlet_items.base_price,
              outlet_items.is_available,
              outlet_items.stock,
              outlet_items.stock_qty,
              outlet_items.is_visible,
              outlet_items.unavailable_reason,
              outlet_items.unavailable_until,
              outlet_items.stoplist_active,
              outlet_items.stoplist_until,
              outlet_items.stoplist_reason,
              outlet_items.delivery_methods,
              items.title,
              items.short_title,
              items.category,
              items.categories,
              items.sku,
              items.description,
              items.photo_url,
              items.image_url,
              items.image_enabled,
              items.weight_grams,
              items.priority,
              items.is_adult,
              items.kcal,
              items.protein,
              items.fat,
              items.carbs,
              items.core_id,
              items.origin_id
       FROM outlet_items
       JOIN items ON items.id = outlet_items.item_id
       WHERE outlet_items.outlet_id = ? AND outlet_items.item_id = ?`
    )
    .get(outletId, itemId);

  if (!item) {
    return res.status(404).json({ error: "Outlet item not found" });
  }

  const now = nowIso();
  const newItemId = db
    .prepare(
      `INSERT INTO items
        (title, short_title, sku, category, categories, description, photo_url, image_url, image_enabled,
         weight_grams, priority, is_adult, kcal, protein, fat, carbs, core_id, origin_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      `${item.title} (copy)`,
      item.short_title ?? null,
      null,
      item.category ?? null,
      item.categories ?? null,
      item.description ?? null,
      item.photo_url ?? null,
      item.image_url ?? item.photo_url ?? null,
      item.image_enabled ?? 1,
      item.weight_grams ?? 0,
      item.priority ?? 0,
      item.is_adult ?? 0,
      item.kcal ?? null,
      item.protein ?? null,
      item.fat ?? null,
      item.carbs ?? null,
      item.core_id ?? null,
      item.origin_id ?? String(itemId),
      now
    ).lastInsertRowid;

  db.prepare(
    `INSERT INTO outlet_items
      (outlet_id, item_id, base_price, is_available, stock, stock_qty, is_visible,
       stoplist_active, stoplist_reason, stoplist_until, delivery_methods,
       unavailable_reason, unavailable_until, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    outletId,
    newItemId,
    Number(item.base_price || 0),
    item.is_available ?? 1,
    item.stock ?? null,
    item.stock_qty ?? item.stock ?? null,
    item.is_visible ?? 1,
    item.stoplist_active ?? 0,
    item.stoplist_reason ?? null,
    item.stoplist_until ?? null,
    item.delivery_methods ?? null,
    item.unavailable_reason ?? null,
    item.unavailable_until ?? null,
    now
  );

  logAudit({
    entity_type: "item",
    entity_id: newItemId,
    action: "duplicate",
    actor_id: getActorId(req),
    before: { outlet_id: outletId, source_item_id: itemId, ...item },
    after: { outlet_id: outletId, item_id: newItemId }
  });

  res.status(201).json({ itemId: newItemId, outletId });
});

app.post(
  "/api/outlets/:outletId/items/:itemId/copy-to-outlet",
  requireRole(["admin"]),
  (req, res) => {
    const outletId = Number(req.params.outletId);
    const itemId = Number(req.params.itemId);
    const targetOutletId = Number(req.body?.target_outlet_id);
    if (!targetOutletId) {
      return res.status(400).json({ error: "Target outlet is required" });
    }

    const targetExists = db
      .prepare("SELECT 1 FROM outlets WHERE id = ?")
      .get(targetOutletId);
    if (!targetExists) {
      return res.status(404).json({ error: "Target outlet not found" });
    }

    const item = db
      .prepare(
        `SELECT outlet_items.base_price,
                outlet_items.is_available,
                outlet_items.stock,
                outlet_items.stock_qty,
                outlet_items.is_visible,
                outlet_items.unavailable_reason,
                outlet_items.unavailable_until,
                outlet_items.stoplist_active,
                outlet_items.stoplist_until,
                outlet_items.stoplist_reason,
                outlet_items.delivery_methods,
                items.title,
                items.short_title,
                items.category,
                items.categories,
                items.sku,
                items.description,
                items.photo_url,
                items.image_url,
                items.image_enabled,
                items.weight_grams,
                items.priority,
                items.is_adult,
                items.kcal,
                items.protein,
                items.fat,
                items.carbs,
                items.core_id,
                items.origin_id
         FROM outlet_items
         JOIN items ON items.id = outlet_items.item_id
         WHERE outlet_items.outlet_id = ? AND outlet_items.item_id = ?`
      )
      .get(outletId, itemId);

    if (!item) {
      return res.status(404).json({ error: "Outlet item not found" });
    }

    const now = nowIso();
    const newItemId = db
      .prepare(
        `INSERT INTO items
          (title, short_title, sku, category, categories, description, photo_url, image_url, image_enabled,
           weight_grams, priority, is_adult, kcal, protein, fat, carbs, core_id, origin_id, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        item.title,
        item.short_title ?? null,
        null,
        item.category ?? null,
        item.categories ?? null,
        item.description ?? null,
        item.photo_url ?? null,
        item.image_url ?? item.photo_url ?? null,
        item.image_enabled ?? 1,
        item.weight_grams ?? 0,
        item.priority ?? 0,
        item.is_adult ?? 0,
        item.kcal ?? null,
        item.protein ?? null,
        item.fat ?? null,
        item.carbs ?? null,
        item.core_id ?? null,
        item.origin_id ?? String(itemId),
        now
      ).lastInsertRowid;

    db.prepare(
      `INSERT INTO outlet_items
        (outlet_id, item_id, base_price, is_available, stock, stock_qty, is_visible,
         stoplist_active, stoplist_reason, stoplist_until, delivery_methods,
         unavailable_reason, unavailable_until, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      targetOutletId,
      newItemId,
      Number(item.base_price || 0),
      item.is_available ?? 1,
      item.stock ?? null,
      item.stock_qty ?? item.stock ?? null,
      item.is_visible ?? 1,
      item.stoplist_active ?? 0,
      item.stoplist_reason ?? null,
      item.stoplist_until ?? null,
      item.delivery_methods ?? null,
      item.unavailable_reason ?? null,
      item.unavailable_until ?? null,
      now
    );

    logAudit({
      entity_type: "item",
      entity_id: newItemId,
      action: "copy_to_outlet",
      actor_id: getActorId(req),
      before: { outlet_id: outletId, source_item_id: itemId, ...item },
      after: { outlet_id: targetOutletId, item_id: newItemId }
    });

    res.status(201).json({ itemId: newItemId, outletId: targetOutletId });
  }
);

app.delete("/api/outlets/:outletId/items/:itemId", requireRole(["admin"]), (req, res) => {
  const outletId = Number(req.params.outletId);
  const itemId = Number(req.params.itemId);

  const existing = db
    .prepare(
      `SELECT outlet_items.base_price,
              outlet_items.is_available,
              outlet_items.stock,
              outlet_items.stock_qty,
              outlet_items.is_visible,
              outlet_items.unavailable_reason,
              outlet_items.unavailable_until,
              outlet_items.stoplist_active,
              outlet_items.stoplist_until,
              outlet_items.stoplist_reason,
              outlet_items.delivery_methods,
              items.title,
              items.short_title,
              items.category,
              items.categories,
              items.sku,
              items.description,
              items.photo_url,
              items.image_url,
              items.image_enabled,
              items.weight_grams,
              items.priority,
              items.is_adult,
              items.kcal,
              items.protein,
              items.fat,
              items.carbs,
              items.core_id,
              items.origin_id
       FROM outlet_items
       JOIN items ON items.id = outlet_items.item_id
       WHERE outlet_items.outlet_id = ? AND outlet_items.item_id = ?`
    )
    .get(outletId, itemId);
  if (!existing) {
    return res.status(404).json({ error: "Outlet item not found" });
  }

  db.prepare(
    `DELETE FROM outlet_campaign_items
     WHERE item_id = ?
       AND campaign_id IN (SELECT id FROM outlet_campaigns WHERE outlet_id = ?)`
  ).run(itemId, outletId);

  db.prepare(
    "DELETE FROM outlet_items WHERE outlet_id = ? AND item_id = ?"
  ).run(outletId, itemId);

  logAudit({
    entity_type: "item",
    entity_id: itemId,
    action: "delete",
    actor_id: getActorId(req),
    before: { outlet_id: outletId, ...existing },
    after: null
  });

  res.json({ ok: true });
});

app.get("/api/outlets/:outletId/items/:itemId/price-history", (req, res) => {
  const outletId = Number(req.params.outletId);
  const itemId = Number(req.params.itemId);
  const rows = db
    .prepare(
      `SELECT id,
              outlet_id,
              item_id,
              old_price,
              new_price,
              changed_by_user_id,
              reason,
              created_at
       FROM outlet_item_price_history
       WHERE outlet_id = ? AND item_id = ?
       ORDER BY created_at DESC`
    )
    .all(outletId, itemId);
  res.json(rows);
});

app.get("/api/couriers", (_req, res) => {
  const { status, q } = _req.query;
  const qNumber = q ? Number(q) : null;
  let sql =
    "SELECT user_id, is_active, rating_avg, rating_count, phone, full_name, address, delivery_methods FROM couriers";
  const { conditions, params } = buildFilters([
    {
      value: qNumber !== null && !Number.isNaN(qNumber) ? qNumber : null,
      clause: "user_id = @q",
      paramName: "q"
    },
    {
      value: status
        ? status === "active"
          ? 1
          : 0
        : null,
      clause: "is_active = @is_active",
      paramName: "is_active"
    }
  ]);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY user_id";
  res.json(db.prepare(sql).all(params));
});

app.get("/api/couriers/list", (req, res) => {
  const { status, blocked } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;

  const { conditions, params } = buildFilters([
    {
      value: status
        ? status === "online"
          ? 1
          : 0
        : null,
      clause: "couriers.is_active = @is_active",
      paramName: "is_active"
    },
    {
      value: blocked ? (blocked === "true" ? "blocked" : "active") : null,
      clause: "users.status = @blocked_status",
      paramName: "blocked_status"
    }
  ]);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const count = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM couriers
       JOIN users ON users.id = couriers.user_id
       ${where}`
    )
    .get(params).count;

  const items = db
    .prepare(
      `SELECT couriers.user_id as id,
              users.username,
              users.tg_id,
              users.status as user_status,
              couriers.is_active,
              couriers.rating_avg,
              couriers.rating_count,
              couriers.phone,
              couriers.full_name,
              couriers.address,
              couriers.delivery_methods,
              COALESCE(stats.orders_today, 0) as orders_today
       FROM couriers
       JOIN users ON users.id = couriers.user_id
       LEFT JOIN (
         SELECT courier_user_id,
                COUNT(*) as orders_today
         FROM orders
         WHERE DATE(created_at) = DATE('now')
         GROUP BY courier_user_id
       ) stats ON stats.courier_user_id = couriers.user_id
       ${where}
       ORDER BY couriers.user_id DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });

  res.json({ items, page, limit, total: count });
});

app.post("/api/couriers", requireRole(["admin", "operator"]), (req, res) => {
  const payload = {
    user_id: req.body.user_id,
    is_active: req.body.is_active ?? 1,
    rating_avg: req.body.rating_avg ?? 0,
    rating_count: req.body.rating_count ?? 0,
    phone: req.body.phone ?? null,
    full_name: req.body.full_name ?? null,
    address: req.body.address ?? null,
    delivery_methods: req.body.delivery_methods ?? null
  };
  createCourierStmt.run(payload);
  const courier = db
    .prepare(
      `SELECT user_id, is_active, rating_avg, rating_count, phone, full_name, address, delivery_methods
       FROM couriers WHERE user_id = ?`
    )
    .get(payload.user_id);
  logAudit({
    entity_type: "courier",
    entity_id: courier.user_id,
    action: "create",
    actor_id: getActorId(req),
    before: null,
    after: courier
  });
  res.status(201).json(courier);
});

app.patch("/api/couriers/:id", requireRole(["admin", "operator"]), (req, res) => {
  const userId = Number(req.params.id);
  const courier = db
    .prepare(
      "SELECT user_id, is_active, rating_avg, rating_count, phone, full_name, address, delivery_methods FROM couriers WHERE user_id = ?"
    )
    .get(userId);
  if (!courier) {
    return res.status(404).json({ error: "Courier not found" });
  }
  updateCourierStmt.run({
    user_id: userId,
    is_active: req.body.is_active ?? null,
    rating_avg: req.body.rating_avg ?? null,
    rating_count: req.body.rating_count ?? null,
    phone: req.body.phone ?? null,
    full_name: req.body.full_name ?? null,
    address: req.body.address ?? null,
    delivery_methods: req.body.delivery_methods ?? null
  });
  const updated = db
    .prepare(
      `SELECT user_id, is_active, rating_avg, rating_count, phone, full_name, address, delivery_methods
       FROM couriers WHERE user_id = ?`
    )
    .get(userId);
  logAudit({
    entity_type: "courier",
    entity_id: userId,
    action: "update",
    actor_id: getActorId(req),
    before: courier,
    after: updated
  });
  res.json(updated);
});

app.patch("/api/couriers/:id/status", requireRole(["admin", "support", "operator"]), (req, res) => {
  const userId = Number(req.params.id);
  const status = req.body.status;
  if (!status) {
    return res.status(400).json({ error: "status required" });
  }
  const before = db
    .prepare("SELECT status FROM users WHERE id = ?")
    .get(userId);
  db.prepare(
    "UPDATE users SET status = @status, updated_at = @updated_at WHERE id = @id"
  ).run({ id: userId, status, updated_at: nowIso() });
  logAudit({
    entity_type: "courier",
    entity_id: userId,
    action: "status",
    actor_id: getActorId(req),
    before,
    after: { status }
  });
  res.json({ id: userId, status });
});

app.get("/api/couriers/:id", (req, res) => {
  const userId = Number(req.params.id);
  const row = db
    .prepare(
      `SELECT couriers.user_id as id,
              users.username,
              users.tg_id,
              users.status as user_status,
              users.created_at,
              users.updated_at,
              couriers.is_active,
              couriers.rating_avg,
              couriers.rating_count,
              couriers.phone,
              couriers.full_name,
              couriers.address,
              couriers.delivery_methods
       FROM couriers
       JOIN users ON users.id = couriers.user_id
       WHERE couriers.user_id = ?`
    )
    .get(userId);
  if (!row) {
    return res.status(404).json({ error: "Courier not found" });
  }
  res.json(row);
});

app.get("/api/couriers/:id/orders", (req, res) => {
  const userId = Number(req.params.id);
  const { q, status } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "orders.order_number LIKE @q",
      paramName: "q"
    },
    { value: status, clause: "orders.status = @status", paramName: "status" }
  ]);
  const where = ["orders.courier_user_id = @courier_id", ...conditions].join(
    " AND "
  );
  const count = db
    .prepare(`SELECT COUNT(*) as count FROM orders WHERE ${where}`)
    .get({ ...params, courier_id: userId }).count;
  const items = db
    .prepare(
      `SELECT orders.id,
              orders.order_number,
              orders.created_at,
              orders.status,
              orders.total_amount,
              orders.delivery_address,
              outlets.name as outlet_name
       FROM orders
       LEFT JOIN outlets ON outlets.id = orders.outlet_id
       WHERE ${where}
       ORDER BY orders.created_at DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, courier_id: userId, limit, offset });
  res.json({ items, page, limit, total: count });
});

app.get("/api/couriers/:id/notes", (req, res) => {
  const userId = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT entity_notes.id,
              entity_notes.text,
              entity_notes.created_at,
              entity_notes.author_user_id,
              users.username as author_username,
              users.tg_id as author_tg_id
       FROM entity_notes
       LEFT JOIN users ON users.id = entity_notes.author_user_id
       WHERE entity_notes.entity_type = 'courier' AND entity_notes.entity_id = ?
       ORDER BY entity_notes.created_at DESC`
    )
    .all(userId);
  res.json(rows);
});

app.post("/api/couriers/:id/notes", requireRole(["admin", "support", "operator"]), (req, res) => {
  const userId = Number(req.params.id);
  const text = req.body.text;
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }
  const authorId = getActorId(req);
  const result = db
    .prepare(
      "INSERT INTO entity_notes (entity_type, entity_id, author_user_id, text) VALUES ('courier', ?, ?, ?)"
    )
    .run(userId, authorId, text);
  const note = db
    .prepare(
      `SELECT entity_notes.id,
              entity_notes.text,
              entity_notes.created_at,
              entity_notes.author_user_id,
              users.username as author_username,
              users.tg_id as author_tg_id
       FROM entity_notes
       LEFT JOIN users ON users.id = entity_notes.author_user_id
       WHERE entity_notes.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json(note);
});

app.delete("/api/couriers/:id/notes/:noteId", requireRole(["admin", "support", "operator"]), (req, res) => {
  const noteId = Number(req.params.noteId);
  db.prepare("DELETE FROM entity_notes WHERE id = ?").run(noteId);
  res.status(204).send();
});

app.delete("/api/couriers/:id", requireRole(["admin"]), (req, res) => {
  const userId = Number(req.params.id);
  deleteCourierStmt.run(userId);
  res.status(204).send();
});

app.get("/api/orders", (_req, res) => {
  const { q, status, outlet_id, courier_user_id } = _req.query;
  const outletIdNumber = outlet_id ? Number(outlet_id) : null;
  const courierIdNumber = courier_user_id ? Number(courier_user_id) : null;
  let sql =
    `SELECT id, order_number, outlet_id, client_user_id, courier_user_id, status,
            pickup_attempts, pickup_code_hash, pickup_code_plain, pickup_locked_until,
            accepted_at, ready_at, picked_up_at, delivered_at, prep_eta_minutes,
            sla_due_at, sla_breached, total_amount, delivery_address, created_at
     FROM orders`;
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "order_number LIKE @q",
      paramName: "q"
    },
    { value: status, clause: "status = @status", paramName: "status" },
    {
      value:
        outletIdNumber !== null && !Number.isNaN(outletIdNumber)
          ? outletIdNumber
          : null,
      clause: "outlet_id = @outlet_id",
      paramName: "outlet_id"
    },
    {
      value:
        courierIdNumber !== null && !Number.isNaN(courierIdNumber)
          ? courierIdNumber
          : null,
      clause: "courier_user_id = @courier_user_id",
      paramName: "courier_user_id"
    }
  ]);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY id";
  res.json(db.prepare(sql).all(params));
});

app.get("/api/orders/list", (req, res) => {
  const {
    q,
    status,
    outlet_id,
    courier_user_id,
    phone,
    date_from,
    date_to,
    problematic,
    sort
  } = req.query;
  const outletIdNumber = outlet_id ? Number(outlet_id) : null;
  const courierIdNumber = courier_user_id ? Number(courier_user_id) : null;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const qValue = q ? `%${q}%` : null;
  const phoneValue = phone ? `%${phone}%` : null;

  const { conditions, params } = buildFilters([
    {
      value: qValue,
      clause: "orders.order_number LIKE @q",
      paramName: "q"
    },
    {
      value: phoneValue,
      clause: "clients.phone LIKE @phone",
      paramName: "phone"
    },
    { value: status, clause: "orders.status = @status", paramName: "status" },
    {
      value:
        outletIdNumber !== null && !Number.isNaN(outletIdNumber)
          ? outletIdNumber
          : null,
      clause: "orders.outlet_id = @outlet_id",
      paramName: "outlet_id"
    },
    {
      value:
        courierIdNumber !== null && !Number.isNaN(courierIdNumber)
          ? courierIdNumber
          : null,
      clause: "orders.courier_user_id = @courier_user_id",
      paramName: "courier_user_id"
    },
    {
      value: date_from || null,
      clause: "orders.created_at >= @date_from",
      paramName: "date_from"
    },
    {
      value: date_to || null,
      clause: "orders.created_at <= @date_to",
      paramName: "date_to"
    }
  ]);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const baseSql = `SELECT orders.id,
                          orders.order_number,
                          orders.status,
                          orders.created_at,
                          orders.accepted_at,
                          orders.ready_at,
                          orders.picked_up_at,
                          orders.delivered_at,
                          orders.total_amount,
                          orders.delivery_address,
                          orders.courier_user_id,
                          clients.phone as client_phone,
                          clients.full_name as client_name,
                          outlets.name as outlet_name
                   FROM orders
                   LEFT JOIN clients ON clients.user_id = orders.client_user_id
                   LEFT JOIN outlets ON outlets.id = orders.outlet_id
                   ${where}`;

  const wantsProblematic = String(problematic || "") === "true";
  const sortValue = String(sort || "created_at:desc");
  const wantsSeveritySort = sortValue.startsWith("severity");

  if (wantsProblematic || wantsSeveritySort) {
    const allItems = db.prepare(`${baseSql} ORDER BY orders.created_at DESC`).all(params);
    const eventsMap = fetchOrderEventsMap(allItems.map((item) => item.id));
    let items = allItems.map((order) => ({
      ...order,
      ...computeOrderSignals(order, eventsMap[order.id] || [])
    }));
    if (wantsProblematic) {
      items = items.filter((item) => item.problemsCount > 0);
    }
    if (wantsSeveritySort) {
      items = items.sort((a, b) => {
        if (b.overallSeverityRank !== a.overallSeverityRank) {
          return b.overallSeverityRank - a.overallSeverityRank;
        }
        return toMs(b.created_at) - toMs(a.created_at);
      });
    } else if (sortValue === "created_at:asc") {
      items = items.sort((a, b) => toMs(a.created_at) - toMs(b.created_at));
    }
    const total = items.length;
    const paged = items.slice(offset, offset + limit);
    return res.json({ items: paged, page, limit, total });
  }

  const count = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM orders
       LEFT JOIN clients ON clients.user_id = orders.client_user_id
       ${where}`
    )
    .get(params).count;

  const items = db
    .prepare(`${baseSql} ORDER BY orders.created_at DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });
  const eventsMap = fetchOrderEventsMap(items.map((item) => item.id));
  const enriched = items.map((order) => ({
    ...order,
    ...computeOrderSignals(order, eventsMap[order.id] || [])
  }));

  res.json({ items: enriched, page, limit, total: count });
});

app.get("/api/orders/:id/details", (req, res) => {
  const id = Number(req.params.id);
  const row = db
    .prepare(
      `SELECT orders.id,
              orders.order_number,
              orders.status,
              orders.created_at,
              orders.accepted_at,
              orders.ready_at,
              orders.picked_up_at,
              orders.delivered_at,
              orders.promised_delivery_at,
              orders.sent_to_restaurant_at,
              orders.total_amount,
              orders.subtotal_food,
              orders.courier_fee,
              orders.service_fee,
              orders.discount_amount,
              orders.promo_discount_amount,
              orders.campaign_discount_amount,
              orders.campaign_ids,
              orders.promo_code,
              orders.delivery_address,
              orders.delivery_address_comment,
              orders.address_entrance,
              orders.address_floor,
              orders.address_apartment,
              orders.comment_to_restaurant,
              orders.comment_to_address,
              orders.crm_comment,
              orders.receiver_name,
              orders.receiver_phone,
              orders.orderer_phone,
              orders.utensils_count,
              orders.is_for_other,
              orders.courier_user_id,
              orders.client_user_id,
              orders.outlet_id,
              clients.full_name as client_name,
              clients.phone as client_phone,
              users.tg_id as client_tg_id,
              users.username as client_username,
              outlets.name as outlet_name
       FROM orders
       LEFT JOIN clients ON clients.user_id = orders.client_user_id
       LEFT JOIN users ON users.id = orders.client_user_id
       LEFT JOIN outlets ON outlets.id = orders.outlet_id
       WHERE orders.id = ?`
    )
    .get(id);
  if (!row) {
    return res.status(404).json({ error: "Order not found" });
  }
  const items = db
    .prepare(
      `SELECT id,
              item_id,
              title,
              description,
              photo_url,
              sku,
              weight_grams,
              unit_price,
              quantity,
              total_price
       FROM order_items
       WHERE order_id = ?
       ORDER BY id ASC`
    )
    .all(id);
  const events = db
    .prepare(
      `SELECT order_events.id,
              order_events.type,
              order_events.payload,
              order_events.created_at,
              order_events.actor_id,
              users.username as actor_username
       FROM order_events
       LEFT JOIN users ON users.id = order_events.actor_id
       WHERE order_events.order_id = ?
       ORDER BY order_events.created_at ASC`
    )
    .all(id)
    .map((event) => ({
      ...event,
      payload: normalizeEventPayload(event.payload)
    }));
  const signals = computeOrderSignals(row, events);
  const promoDiscount = row.promo_discount_amount ?? row.discount_amount ?? 0;
  const campaignDiscount = row.campaign_discount_amount ?? 0;
  const totalAmount =
    row.total_amount ??
    Math.max(
      0,
      (row.subtotal_food || 0) +
        (row.courier_fee || 0) +
        (row.service_fee || 0) -
        promoDiscount -
        campaignDiscount
    );
  res.json({
    ...row,
    total_amount: totalAmount,
    items,
    ...signals,
    links: {
      clientId: row.client_user_id,
      userId: row.client_user_id,
      courierId: row.courier_user_id,
      outletId: row.outlet_id
    }
  });
});

app.get("/api/orders/:id/events", (req, res) => {
  const id = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT order_events.id,
              order_events.type,
              order_events.payload,
              order_events.created_at,
              order_events.actor_id,
              users.username as actor_username
       FROM order_events
       LEFT JOIN users ON users.id = order_events.actor_id
       WHERE order_events.order_id = ?
       ORDER BY order_events.created_at DESC`
    )
    .all(id);
  res.json(
    rows.map((row) => ({
      ...row,
      payload: normalizeEventPayload(row.payload)
    }))
  );
});

app.post(
  "/api/orders/:id/events",
  requireRole(["admin", "support"]),
  (req, res) => {
    const id = Number(req.params.id);
    const order = getOrderStmt.get(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    logOrderEvent({
      order_id: id,
      type: "note_added",
      payload: { text },
      actor_id: getActorId(req)
    });
    res.status(201).json({ status: "ok" });
  }
);

app.get(
  "/api/cancel-reasons",
  requireRole(["admin", "support", "operator"]),
  (_req, res) => {
    const rows = listCancelReasonsStmt.all();
    const grouped = rows.reduce(
      (acc, row) => {
        acc[row.group_code].push({
          code: row.code,
          group_code: row.group_code,
          label_ru: row.label_ru,
          label_uz: row.label_uz,
          label_kaa: row.label_kaa,
          label_en: row.label_en,
          requires_comment: Boolean(row.requires_comment),
          effects_json: row.effects_json
        });
        return acc;
      },
      { client: [], partner: [], courier: [] }
    );
    res.json({ groups: grouped });
  }
);

app.post(
  "/api/orders/:id/cancel",
  requireRole(["admin", "support", "operator"]),
  (req, res) => {
    const id = Number(req.params.id);
    const order = getOrderCancelStmt.get(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (["delivered", "cancelled"].includes(order.status)) {
      return res.status(409).json({ error: "Order cannot be cancelled" });
    }

    const reasonCode = String(req.body?.reason_code || "").trim();
    if (!reasonCode) {
      return res.status(400).json({ error: "reason_code required" });
    }
    const reason = getCancelReasonStmt.get(reasonCode);
    if (!reason) {
      return res.status(404).json({ error: "Cancel reason not found" });
    }
    const comment = String(req.body?.comment || "").trim();
    if (reason.requires_comment && !comment) {
      return res.status(400).json({ error: "comment required" });
    }
    const notifyClient = Boolean(req.body?.notify_client);
    const clientNotified = Boolean(req.body?.client_notified);
    const actorId = getActorId(req);
    const actorRole = getRole(req);
    const actorTg = getActorTg(req);
    const effects = parseJsonSafe(reason.effects_json, {});
    const before = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);

    updateOrderCancelStmt.run({
      id,
      cancelled_at: nowIso()
    });

    insertOrderCancellationStmt.run({
      id: crypto.randomUUID(),
      order_id: id,
      group_code: reason.group_code,
      reason_code: reason.code,
      comment: comment || null,
      notify_client: notifyClient ? 1 : 0,
      client_notified: clientNotified ? 1 : 0,
      effects_json: JSON.stringify(effects),
      created_by_role: actorRole,
      created_by_tg_id: actorTg || null,
      created_at: nowIso()
    });

    logOrderEvent({
      order_id: id,
      type: "cancelled",
      payload: {
        reason_code: reason.code,
        comment: comment || null,
        notify_client: notifyClient,
        client_notified: clientNotified,
        effects
      },
      actor_id: actorId
    });

    if (notifyClient) {
      logOrderEvent({
        order_id: id,
        type: "notify_client",
        payload: { reason_code: reason.code, comment: comment || null },
        actor_id: actorId
      });
      logAudit({
        entity_type: "order",
        entity_id: id,
        action: "notify_client",
        actor_id: actorId,
        before,
        after: { ...before }
      });
    }

    applyCancellationEffects({
      order,
      effects,
      actorRole,
      actorTg,
      actorId
    });

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    logAudit({
      entity_type: "order",
      entity_id: id,
      action: "cancel",
      actor_id: actorId,
      before,
      after: updated
    });
    res.json(updated);
  }
);

app.post("/api/orders/:id/reassign", requireRole(["admin", "support", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const order = getOrderStmt.get(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const before = { ...order };
  const courierUserId = Number(req.body?.courier_user_id || 0);
  if (!courierUserId) {
    return res.status(400).json({ error: "courier_user_id required" });
  }
  updateOrderStmt.run({
    id,
    status: null,
    courier_user_id: courierUserId,
    prep_eta_minutes: null,
    total_amount: null,
    delivery_address: null
  });
  logOrderEvent({
    order_id: id,
    type: "reassigned",
    payload: { courier_user_id: courierUserId },
    actor_id: getActorId(req)
  });
  const updated = getOrderStmt.get(id);
  logAudit({
    entity_type: "order",
    entity_id: id,
    action: "reassign",
    actor_id: getActorId(req),
    before,
    after: updated
  });
  res.json(updated);
});

  app.post(
    "/api/orders/:id/compensation",
    requireRole(["admin", "support", "operator"]),
    (req, res) => {
    const id = Number(req.params.id);
    const order = getOrderStmt.get(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const reason = String(req.body?.reason || "").trim();
    const mode = req.body?.mode === "percent" ? "percent" : "amount";
    const value = Number(req.body?.value || 0);
    const comment = String(req.body?.comment || "").trim();
    if (!reason) {
      return res.status(400).json({ error: "reason is required" });
    }
    if (!value || Number.isNaN(value)) {
      return res.status(400).json({ error: "value is required" });
    }
    const amount =
      mode === "percent"
        ? Math.max(0, Math.round(((order.subtotal_food || 0) * value) / 100))
        : Math.max(0, Math.round(value));
    if (!amount) {
      return res.status(400).json({ error: "value is invalid" });
    }
    const actorRole = getRole(req);
    const actorTg = getActorTg(req);
    const actorId = getActorId(req);
    createLedgerStmt.run({
      title: `Compensation ${order.order_number}`,
      amount,
      status: "completed",
      type: "compensation",
      user_id: order.client_user_id,
      partner_id: null,
      order_id: order.id,
      balance_delta: amount,
      category: "client",
      entity_type: "client",
      entity_id: order.client_user_id,
      currency: "UZS",
      meta_json: JSON.stringify({ reason, mode, value, comment }),
      created_by_role: actorRole,
      created_by_tg_id: actorTg || null
    });
    insertOrderAdjustmentStmt.run({
      order_id: order.id,
      kind: "compensation",
      amount,
      reason_code: reason,
      comment: comment || null,
      created_by_role: actorRole,
      created_by_tg_id: actorTg || null,
      created_at: nowIso()
    });
    logOrderEvent({
      order_id: id,
      type: "compensation_issued",
      payload: { reason, mode, value, amount, comment },
      actor_id: actorId
    });
    logAudit({
      entity_type: "order",
      entity_id: id,
      action: "compensation",
      actor_id: actorId,
      before: order,
      after: { ...order }
    });
      res.status(201).json({ status: "ok", amount });
    }
  );

  app.post(
    "/api/orders/:id/items",
    requireRole(["admin", "support", "operator"]),
    (req, res) => {
      const id = Number(req.params.id);
      const order = getOrderPricingStmt.get(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const comment = String(req.body?.comment || "").trim();
      if (!comment) {
        return res.status(400).json({ error: "comment is required" });
      }
      const incomingItems = Array.isArray(req.body?.items) ? req.body.items : null;
      if (!incomingItems) {
        return res.status(400).json({ error: "items are required" });
      }

      const normalized = incomingItems.map((item) => ({
        id: item?.id ? Number(item.id) : null,
        item_id: item?.item_id ? Number(item.item_id) : null,
        title: String(item?.title || "").trim(),
        description: item?.description ? String(item.description).trim() : null,
        photo_url: item?.photo_url ? String(item.photo_url).trim() : null,
        sku: item?.sku ? String(item.sku).trim() : null,
        weight_grams: Number(item?.weight_grams || 0),
        unit_price: Number(item?.unit_price || 0),
        quantity: Number(item?.quantity || 0)
      }));

      for (const item of normalized) {
        if (!item.title) {
          return res.status(400).json({ error: "title is required" });
        }
        if (!item.quantity || item.quantity < 1) {
          return res.status(400).json({ error: "quantity is required" });
        }
        if (Number.isNaN(item.unit_price) || item.unit_price < 0) {
          return res.status(400).json({ error: "unit_price is invalid" });
        }
        if (Number.isNaN(item.weight_grams) || item.weight_grams < 0) {
          return res.status(400).json({ error: "weight_grams is invalid" });
        }
      }

      const actorId = getActorId(req);
      const updateItems = db.transaction(() => {
        const beforeItems = getOrderItemsStmt.all(id);
        const existingIds = new Set(beforeItems.map((item) => item.id));
        const seenIds = new Set();

        normalized.forEach((item) => {
          const totalPrice = item.unit_price * item.quantity;
          if (item.id) {
            if (!existingIds.has(item.id)) {
              throw new Error("item not found");
            }
            seenIds.add(item.id);
            updateOrderItemStmt.run(
              item.item_id ?? null,
              item.title,
              item.description,
              item.photo_url,
              item.sku,
              item.weight_grams,
              item.unit_price,
              item.quantity,
              totalPrice,
              item.id,
              id
            );
          } else {
            insertOrderItemStmt.run(
              id,
              item.item_id ?? null,
              item.title,
              item.description,
              item.photo_url,
              item.sku,
              item.weight_grams,
              item.unit_price,
              item.quantity,
              totalPrice
            );
          }
        });

        beforeItems.forEach((item) => {
          if (!seenIds.has(item.id) && existingIds.has(item.id)) {
            deleteOrderItemStmt.run(item.id, id);
          }
        });

        const afterItems = getOrderItemsStmt.all(id);
        const pricing = computeOrderPricing({ order, items: afterItems });
        updateOrderTotalsStmt.run({
          id,
          subtotal_food: pricing.subtotal_food,
          discount_amount: pricing.promo_discount_amount + pricing.campaign_discount_amount,
          promo_discount_amount: pricing.promo_discount_amount,
          campaign_discount_amount: pricing.campaign_discount_amount,
          campaign_ids: pricing.applied_campaigns.length
            ? JSON.stringify(pricing.applied_campaigns.map((entry) => entry.campaign_id))
            : null,
          total_amount: pricing.total_amount
        });

        deleteCampaignUsageByOrderStmt.run(id);
        pricing.applied_campaigns.forEach((entry) => {
          insertCampaignUsageStmt.run(
            entry.campaign_id,
            id,
            order.client_user_id || null,
            entry.discount_amount || 0
          );
        });
        logOrderEvent({
          order_id: id,
          type: "cart_updated",
          payload: {
            comment,
            promo_discount_amount: pricing.promo_discount_amount,
            campaign_discount_amount: pricing.campaign_discount_amount
          },
          actor_id: actorId
        });
        logAudit({
          entity_type: "order",
          entity_id: id,
          action: "cart_update",
          actor_id: actorId,
          before: {
            items: beforeItems,
            subtotal_food: order.subtotal_food,
            promo_discount_amount: order.promo_discount_amount ?? order.discount_amount ?? 0,
            campaign_discount_amount: order.campaign_discount_amount ?? 0,
            total_amount: order.total_amount
          },
          after: {
            items: afterItems,
            subtotal_food: pricing.subtotal_food,
            promo_discount_amount: pricing.promo_discount_amount,
            campaign_discount_amount: pricing.campaign_discount_amount,
            total_amount: pricing.total_amount
          }
        });
        return {
          items: afterItems,
          subtotal_food: pricing.subtotal_food,
          promo_discount_amount: pricing.promo_discount_amount,
          campaign_discount_amount: pricing.campaign_discount_amount,
          total_amount: pricing.total_amount
        };
      });

      try {
        const updated = updateItems();
        return res.json(updated);
      } catch (error) {
        if (error.message === "item not found") {
          return res.status(400).json({ error: "item not found" });
        }
        return res.status(500).json({ error: "Failed to update items" });
      }
    }
  );

  app.post(
    "/api/orders/:id/notify",
    requireRole(["admin", "support", "operator"]),
    (req, res) => {
      const id = Number(req.params.id);
      const order = getOrderStmt.get(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const message = String(req.body?.message || "").trim();
      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }
      logOrderEvent({
        order_id: id,
        type: "notify_client",
        payload: { message },
        actor_id: getActorId(req)
      });
      logAudit({
        entity_type: "order",
        entity_id: id,
        action: "notify_client",
        actor_id: getActorId(req),
        before: order,
        after: { ...order }
      });
      res.status(201).json({ status: "ok" });
    }
  );

  app.post(
    "/api/orders/:id/resend",
    requireRole(["admin", "support", "operator"]),
    (req, res) => {
      const id = Number(req.params.id);
      const order = getOrderStmt.get(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      logOrderEvent({
        order_id: id,
        type: "resend_to_restaurant",
        payload: null,
        actor_id: getActorId(req)
      });
      logAudit({
        entity_type: "order",
        entity_id: id,
        action: "resend_to_restaurant",
        actor_id: getActorId(req),
        before: order,
        after: { ...order }
      });
      res.status(201).json({ status: "ok" });
    }
  );

app.post("/api/orders", requireRole(["admin", "operator"]), (req, res) => {
  const payload = {
    order_number: toOrderNumber(req.body.order_number),
    outlet_id: req.body.outlet_id,
    client_user_id: req.body.client_user_id,
    courier_user_id: req.body.courier_user_id ?? null,
    status: req.body.status ?? "accepted_by_system",
    total_amount: req.body.total_amount ?? 0,
    delivery_address: req.body.delivery_address ?? null
  };
  const result = createOrderStmt.run(payload);
  logOrderEvent({
    order_id: result.lastInsertRowid,
    type: "created",
    payload: { status: payload.status },
    actor_id: getActorId(req)
  });
  const created = getOrderStmt.get(result.lastInsertRowid);
  logAudit({
    entity_type: "order",
    entity_id: created.id,
    action: "create",
    actor_id: getActorId(req),
    before: null,
    after: created
  });
  res.status(201).json(created);
});

app.get("/api/orders/:id", (req, res) => {
  const order = getOrderStmt.get(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const events = db
    .prepare(
      `SELECT order_id, type, payload, created_at
       FROM order_events
       WHERE order_id = ?
       ORDER BY created_at ASC`
    )
    .all(order.id)
    .map((event) => ({
      ...event,
      payload: normalizeEventPayload(event.payload)
    }));
  const signals = computeOrderSignals(order, events);
  return res.json({
    ...order,
    ...signals,
    links: {
      clientId: order.client_user_id,
      userId: order.client_user_id,
      courierId: order.courier_user_id,
      outletId: order.outlet_id
    }
  });
});

app.patch("/api/orders/:id", requireRole(["admin", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const order = getOrderStmt.get(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const before = { ...order };

  updateOrderStmt.run({
    id,
    status: req.body.status ?? null,
    courier_user_id: req.body.courier_user_id ?? null,
    prep_eta_minutes: req.body.prep_eta_minutes ?? null,
    total_amount: req.body.total_amount ?? null,
    delivery_address: req.body.delivery_address ?? null
  });
  logOrderEvent({
    order_id: id,
    type: "updated",
    payload: req.body,
    actor_id: getActorId(req)
  });
  const updated = getOrderStmt.get(id);
  logAudit({
    entity_type: "order",
    entity_id: id,
    action: "update",
    actor_id: getActorId(req),
    before,
    after: updated
  });
  return res.json(updated);
});

app.delete("/api/orders/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  deleteOrderStmt.run(id);
  res.status(204).send();
});

app.post("/api/orders/:id/accept", requireRole(["admin", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const order = getOrderStmt.get(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const before = { ...order };

  const pickupCode = generatePickupCode();
  const prepEta = req.body.prep_eta_minutes ?? null;
  const slaDueAt = prepEta ? calcSlaDueAt(prepEta) : null;
  updateOrderAcceptStmt.run({
    id,
    accepted_at: nowIso(),
    prep_eta_minutes: prepEta,
    pickup_code_hash: hashCode(pickupCode),
    pickup_code_plain: pickupCode,
    sla_due_at: slaDueAt
  });
  logOrderEvent({
    order_id: id,
    type: "accepted",
    payload: { prep_eta_minutes: prepEta },
    actor_id: getActorId(req)
  });

  const updated = getOrderStmt.get(id);
  logAudit({
    entity_type: "order",
    entity_id: id,
    action: "accept",
    actor_id: getActorId(req),
    before,
    after: updated
  });
  return res.json({ order: updated, pickup_code: pickupCode });
});

app.post("/api/orders/:id/ready", requireRole(["admin", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const order = getOrderStmt.get(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const before = { ...order };

  const slaBreached =
    order.sla_due_at && Date.now() > order.sla_due_at ? 1 : 0;
  updateOrderReadyStmt.run({ id, ready_at: nowIso(), sla_breached: slaBreached });
  logOrderEvent({
    order_id: id,
    type: "ready",
    payload: { sla_breached: slaBreached },
    actor_id: getActorId(req)
  });
  const updated = getOrderStmt.get(id);
  logAudit({
    entity_type: "order",
    entity_id: id,
    action: "ready",
    actor_id: getActorId(req),
    before,
    after: updated
  });
  return res.json(updated);
});

app.post("/api/orders/:id/pickup", requireRole(["admin", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const order = getOrderStmt.get(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const before = { ...order };

  if (order.pickup_locked_until && Date.now() < order.pickup_locked_until) {
    return res.status(429).json({ error: "Pickup locked" });
  }

  if (!order.pickup_code_hash) {
    return res.status(400).json({ error: "Pickup code not issued" });
  }

  const code = String(req.body.code ?? "");
  if (hashCode(code) !== order.pickup_code_hash) {
    const attempts = Number(order.pickup_attempts || 0) + 1;
    const lockedUntil =
      attempts >= 3 ? Date.now() + 10 * 60 * 1000 : null;
    updateOrderAttemptsStmt.run({
      id,
      pickup_attempts: attempts,
      pickup_locked_until: lockedUntil
    });
    return res.status(400).json({ error: "Invalid pickup code" });
  }

  updateOrderPickupStmt.run({ id, picked_up_at: nowIso() });
  logOrderEvent({
    order_id: id,
    type: "picked_up",
    payload: null,
    actor_id: getActorId(req)
  });
  const updated = getOrderStmt.get(id);
  logAudit({
    entity_type: "order",
    entity_id: id,
    action: "pickup",
    actor_id: getActorId(req),
    before,
    after: updated
  });
  return res.json(updated);
});

app.post("/api/orders/:id/deliver", requireRole(["admin", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const order = getOrderStmt.get(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const before = { ...order };

  const slaBreached =
    order.sla_due_at && Date.now() > order.sla_due_at ? 1 : 0;
  updateOrderDeliverStmt.run({
    id,
    delivered_at: nowIso(),
    sla_breached: slaBreached
  });
  logOrderEvent({
    order_id: id,
    type: "delivered",
    payload: { sla_breached: slaBreached },
    actor_id: getActorId(req)
  });
  const updated = getOrderStmt.get(id);
  logAudit({
    entity_type: "order",
    entity_id: id,
    action: "deliver",
    actor_id: getActorId(req),
    before,
    after: updated
  });
  return res.json(updated);
});

app.get("/api/promos", (req, res) => {
  const { q, is_active } = req.query;
  const rows = listPromosStmt([
    {
      value: q ? `%${q}%` : null,
      clause: "(promo_codes.code LIKE @q OR promo_codes.description LIKE @q)",
      paramName: "q"
    },
    {
      value:
        is_active !== undefined
          ? Number(is_active)
          : null,
      clause: "promo_codes.is_active = @is_active",
      paramName: "is_active"
    }
  ]).map(attachPromoOutlets);
  res.json(rows);
});

app.post("/api/promos", requireRole(["admin"]), (req, res) => {
  const outletIds = normalizePromoOutlets(req.body);
  const payload = {
    code: req.body.code,
    description: req.body.description ?? null,
    discount_percent: req.body.discount_percent ?? 0,
    max_uses: req.body.max_uses ?? 0,
    used_count: req.body.used_count ?? 0,
    is_active: req.body.is_active ?? 1,
    starts_at: req.body.starts_at ?? null,
    ends_at: req.body.ends_at ?? null,
    min_order_amount: req.body.min_order_amount ?? null,
    outlet_id: outletIds.length === 1 ? outletIds[0] : null,
    first_order_only: req.body.first_order_only ?? null
  };
  const createPromo = db.transaction(() => {
    const result = createPromoStmt.run(payload);
    outletIds.forEach((outletId) => {
      insertPromoOutletStmt.run(result.lastInsertRowid, outletId);
    });
    return result.lastInsertRowid;
  });
  const promoId = createPromo();
  const promo = attachPromoOutlets(getPromoWithOutletsStmt.get(promoId));
  logAudit({
    entity_type: "promo",
    entity_id: promo.id,
    action: "create",
    actor_id: getActorId(req),
    before: null,
    after: promo
  });
  res.status(201).json(promo);
});

app.patch("/api/promos/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const promo = getPromoWithOutletsStmt.get(id);
  if (!promo) {
    return res.status(404).json({ error: "Promo not found" });
  }
  const shouldUpdateOutlets =
    Array.isArray(req.body?.outlet_ids) || req.body?.outlet_id !== undefined;
  const outletIds = normalizePromoOutlets(req.body);
  const updatePromo = db.transaction(() => {
    updatePromoStmt.run({
      id,
      code: req.body.code ?? null,
      description: req.body.description ?? null,
      discount_percent: req.body.discount_percent ?? null,
      max_uses: req.body.max_uses ?? null,
      used_count: req.body.used_count ?? null,
      is_active: req.body.is_active ?? null,
      starts_at: req.body.starts_at ?? null,
      ends_at: req.body.ends_at ?? null,
      min_order_amount: req.body.min_order_amount ?? null,
      outlet_id_set: shouldUpdateOutlets ? 1 : 0,
      outlet_id: outletIds.length === 1 ? outletIds[0] : null,
      first_order_only: req.body.first_order_only ?? null
    });
    if (shouldUpdateOutlets) {
      deletePromoOutletsStmt.run(id);
      outletIds.forEach((outletId) => {
        insertPromoOutletStmt.run(id, outletId);
      });
    }
  });
  updatePromo();
  const updated = attachPromoOutlets(getPromoWithOutletsStmt.get(id));
  logAudit({
    entity_type: "promo",
    entity_id: id,
    action: "update",
    actor_id: getActorId(req),
    before: attachPromoOutlets(promo),
    after: updated
  });
  res.json(updated);
});

app.delete("/api/promos/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const promo = getPromoWithOutletsStmt.get(id);
  deletePromoStmt.run(id);
  if (promo) {
    logAudit({
      entity_type: "promo",
      entity_id: id,
      action: "delete",
      actor_id: getActorId(req),
      before: attachPromoOutlets(promo),
      after: null
    });
  }
  res.status(204).send();
});

app.get("/api/promos/:id", (req, res) => {
  const id = Number(req.params.id);
  const promo = getPromoWithOutletsStmt.get(id);
  if (!promo) {
    return res.status(404).json({ error: "Promo not found" });
  }
  res.json(attachPromoOutlets(promo));
});

app.get("/api/finance/summary", (req, res) => {
  const { status, type, user_id, outlet_id, partner_id, date_from, date_to } =
    req.query;
  const userIdNumber = user_id ? Number(user_id) : null;
  const outletIdNumber = outlet_id ? Number(outlet_id) : null;
  const partnerIdNumber = partner_id ? Number(partner_id) : null;
  const { conditions, params } = buildFilters([
    {
      value: status,
      clause: "finance_ledger.status = @status",
      paramName: "status"
    },
    {
      value: type,
      clause: "finance_ledger.type = @type",
      paramName: "type"
    },
    {
      value:
        userIdNumber !== null && !Number.isNaN(userIdNumber)
          ? userIdNumber
          : null,
      clause: "finance_ledger.user_id = @user_id",
      paramName: "user_id"
    },
    {
      value:
        outletIdNumber !== null && !Number.isNaN(outletIdNumber)
          ? outletIdNumber
          : null,
      clause: "orders.outlet_id = @outlet_id",
      paramName: "outlet_id"
    },
    {
      value:
        partnerIdNumber !== null && !Number.isNaN(partnerIdNumber)
          ? partnerIdNumber
          : null,
      clause: "outlets.partner_id = @partner_id",
      paramName: "partner_id"
    },
    {
      value: date_from || null,
      clause: "finance_ledger.created_at >= @date_from",
      paramName: "date_from"
    },
    {
      value: date_to || null,
      clause: "finance_ledger.created_at <= @date_to",
      paramName: "date_to"
    }
  ]);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const summary = db
    .prepare(
      `SELECT finance_ledger.type, SUM(finance_ledger.amount) as amount
       FROM finance_ledger
       LEFT JOIN orders ON orders.id = finance_ledger.order_id
       LEFT JOIN outlets ON outlets.id = orders.outlet_id
       ${where}
       GROUP BY finance_ledger.type`
    )
    .all(params)
    .map((row) => ({ type: row.type, amount: row.amount }));
  res.json(summary);
});

app.get("/api/audit", requireRole(["admin"]), (req, res) => {
  const { entity_type, actor_id, date_from, date_to } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const offset = (page - 1) * limit;
  const actorIdNumber = actor_id ? Number(actor_id) : null;

  const { conditions, params } = buildFilters([
    {
      value: entity_type || null,
      clause: "audit_log.entity_type = @entity_type",
      paramName: "entity_type"
    },
    {
      value:
        actorIdNumber !== null && !Number.isNaN(actorIdNumber)
          ? actorIdNumber
          : null,
      clause: "audit_log.actor_user_id = @actor_user_id",
      paramName: "actor_user_id"
    },
    {
      value: date_from || null,
      clause: "audit_log.created_at >= @date_from",
      paramName: "date_from"
    },
    {
      value: date_to || null,
      clause: "audit_log.created_at <= @date_to",
      paramName: "date_to"
    }
  ]);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM audit_log ${where}`)
    .get(params).count;

  const items = db
    .prepare(
      `SELECT id,
              entity_type,
              entity_id,
              action,
              actor_user_id,
              before_json,
              after_json,
              created_at
       FROM audit_log
       ${where}
       ORDER BY created_at DESC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });

  res.json({ items, page, limit, total });
});

app.get("/api/dashboard/summary", (_req, res) => {
  const ordersToday = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')")
    .get().count;
  const activeCouriers = db
    .prepare("SELECT COUNT(*) as count FROM couriers WHERE is_active = 1")
    .get().count;
  const delayedOrders = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('delivered','cancelled') AND created_at <= datetime('now','-60 minutes')")
    .get().count;
  const blockedEntities = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE status = 'blocked'")
    .get().count;

  const problemOrders = db
    .prepare("SELECT orders.id, orders.order_number, orders.status, orders.created_at, outlets.name as outlet_name FROM orders LEFT JOIN outlets ON outlets.id = orders.outlet_id WHERE orders.status NOT IN ('delivered','cancelled') ORDER BY orders.created_at ASC LIMIT 10")
    .all();

  res.json({
    cards: [
      { title: "Orders today", value: String(ordersToday) },
      { title: "Active couriers", value: String(activeCouriers) },
      { title: "Delayed orders", value: String(delayedOrders) },
      { title: "Blocked entities", value: String(blockedEntities) }
    ],
    problem_orders: problemOrders
  });
});

app.get("/api/finance/ledger", (req, res) => {
  const { q, status, type, user_id, outlet_id, partner_id, date_from, date_to } =
    req.query;
  const userIdNumber = user_id ? Number(user_id) : null;
  const outletIdNumber = outlet_id ? Number(outlet_id) : null;
  const partnerIdNumber = partner_id ? Number(partner_id) : null;
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "finance_ledger.title LIKE @q",
      paramName: "q"
    },
    {
      value: status,
      clause: "finance_ledger.status = @status",
      paramName: "status"
    },
    { value: type, clause: "finance_ledger.type = @type", paramName: "type" },
    {
      value:
        userIdNumber !== null && !Number.isNaN(userIdNumber)
          ? userIdNumber
          : null,
      clause: "finance_ledger.user_id = @user_id",
      paramName: "user_id"
    },
    {
      value:
        outletIdNumber !== null && !Number.isNaN(outletIdNumber)
          ? outletIdNumber
          : null,
      clause: "orders.outlet_id = @outlet_id",
      paramName: "outlet_id"
    },
    {
      value:
        partnerIdNumber !== null && !Number.isNaN(partnerIdNumber)
          ? partnerIdNumber
          : null,
      clause: "outlets.partner_id = @partner_id",
      paramName: "partner_id"
    },
    {
      value: date_from || null,
      clause: "finance_ledger.created_at >= @date_from",
      paramName: "date_from"
    },
    {
      value: date_to || null,
      clause: "finance_ledger.created_at <= @date_to",
      paramName: "date_to"
    }
  ]);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT finance_ledger.id,
              finance_ledger.title,
              finance_ledger.amount,
              finance_ledger.status,
              finance_ledger.type,
              finance_ledger.created_at,
              finance_ledger.user_id,
              finance_ledger.order_id,
              finance_ledger.balance_delta,
              finance_ledger.category,
              orders.order_number,
              outlets.name as outlet_name,
              partners.name as partner_name
       FROM finance_ledger
       LEFT JOIN orders ON orders.id = finance_ledger.order_id
       LEFT JOIN outlets ON outlets.id = orders.outlet_id
       LEFT JOIN partners ON partners.id = outlets.partner_id
       ${where}
       ORDER BY finance_ledger.id DESC`
    )
    .all(params);
  res.json(rows);
});

app.post("/api/finance/ledger", requireRole(["admin"]), (req, res) => {
  const payload = {
    title: req.body.title,
    amount: req.body.amount,
    status: req.body.status ?? "pending",
    type: req.body.type ?? "commission",
    user_id: req.body.user_id ?? null,
    order_id: req.body.order_id ?? null,
    balance_delta: req.body.balance_delta ?? req.body.amount ?? 0,
    category: req.body.category ?? null
  };
  const result = createLedgerStmt.run(payload);
  res.status(201).json(
    db
      .prepare(
        "SELECT id, title, amount, status, type, created_at, user_id, order_id, balance_delta, category FROM finance_ledger WHERE id = ?"
      )
      .get(result.lastInsertRowid)
  );
});

app.patch("/api/finance/ledger/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const ledger = db
    .prepare("SELECT id FROM finance_ledger WHERE id = ?")
    .get(id);
  if (!ledger) {
    return res.status(404).json({ error: "Ledger entry not found" });
  }
  updateLedgerStmt.run({
    id,
    title: req.body.title ?? null,
    amount: req.body.amount ?? null,
    status: req.body.status ?? null,
    type: req.body.type ?? null,
    user_id: req.body.user_id ?? null,
    order_id: req.body.order_id ?? null,
    balance_delta: req.body.balance_delta ?? null,
    category: req.body.category ?? null
  });
  res.json(
    db
      .prepare(
        "SELECT id, title, amount, status, type, created_at, user_id, order_id, balance_delta, category FROM finance_ledger WHERE id = ?"
      )
      .get(id)
  );
});

app.delete("/api/finance/ledger/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  deleteLedgerStmt.run(id);
  res.status(204).send();
});

setupCampaignRoutes({ app, db, requireRole, logAudit, nowIso, parseSort, getActorId });

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});


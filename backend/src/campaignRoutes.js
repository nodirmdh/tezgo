import crypto from "crypto";

const CAMPAIGN_TYPES = new Set(["discount", "bundle", "bogo"]);
const CAMPAIGN_STATUSES = new Set(["draft", "active", "paused", "expired", "archived"]);
const STOPLIST_POLICIES = new Set(["hide", "disable"]);
const DELIVERY_METHODS = new Set(["courier", "pickup"]);
const DISCOUNT_TYPES = new Set(["percent", "fixed", "new_price"]);

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseJsonValue = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const arrayToJson = (value, fallback = []) => {
  if (!value) {
    return JSON.stringify(fallback);
  }
  const arr = Array.isArray(value) ? value : [value];
  return JSON.stringify(arr.filter(Boolean));
};

const normalizeMethods = (value, fallback = []) => {
  if (!value) {
    return JSON.stringify(fallback.filter((method) => DELIVERY_METHODS.has(method)));
  }
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  const normalized = list
    .map((item) => item?.trim())
    .filter((item) => item && DELIVERY_METHODS.has(item));
  return JSON.stringify(normalized.length ? normalized : fallback.filter((method) => DELIVERY_METHODS.has(method)));
};

const normalizeArrayField = (value, fallback = []) => {
  if (!value) {
    return fallback;
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return fallback;
};

const normalizeObjectField = (value, fallback = null) => {
  if (!value) {
    return fallback;
  }
  if (typeof value === "object") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const serializeJson = (value) => (value === undefined || value === null ? null : JSON.stringify(value));

const toBooleanInt = (value) => (value === true || value === 1 || value === "1" ? 1 : 0);

const sanitizeToInteger = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const setupCampaignRoutes = ({
  app,
  db,
  requireRole,
  logAudit,
  nowIso,
  parseSort,
  getActorId
}) => {
  const insertCampaignStmt = db.prepare(
    `INSERT INTO campaigns
      (id, outlet_id, type, title, description, priority, status, start_at, end_at,
       active_days, active_hours, min_order_amount, max_uses_total, max_uses_per_client,
       delivery_methods, stoplist_policy, bundle_fixed_price, bundle_percent_discount,
       created_by_role, created_by_tg_id, created_at, updated_at, archived_at)
     VALUES (
       @id, @outlet_id, @type, @title, @description, @priority, @status, @start_at, @end_at,
       @active_days, @active_hours, @min_order_amount, @max_uses_total, @max_uses_per_client,
       @delivery_methods, @stoplist_policy, @bundle_fixed_price, @bundle_percent_discount,
       @created_by_role, @created_by_tg_id, @created_at, @updated_at, @archived_at
     )`
  );
  const updateCampaignStmt = db.prepare(
    `UPDATE campaigns
     SET type = @type,
         title = @title,
         description = @description,
         priority = @priority,
         status = @status,
         start_at = @start_at,
         end_at = @end_at,
         active_days = @active_days,
         active_hours = @active_hours,
         min_order_amount = @min_order_amount,
         max_uses_total = @max_uses_total,
         max_uses_per_client = @max_uses_per_client,
         delivery_methods = @delivery_methods,
         stoplist_policy = @stoplist_policy,
         bundle_fixed_price = @bundle_fixed_price,
         bundle_percent_discount = @bundle_percent_discount,
         updated_at = @updated_at
     WHERE id = @id`
  );
  const campaignByIdStmt = db.prepare("SELECT * FROM campaigns WHERE id = ?");
  const campaignItemsStmt = db.prepare(
    `SELECT
       ci.id,
       ci.item_id,
       ci.qty,
       ci.required,
       ci.discount_type,
       ci.discount_value,
       ci.outlet_id,
       items.title,
       outlet_items.base_price
     FROM campaign_items ci
     LEFT JOIN items ON items.id = ci.item_id
     LEFT JOIN outlet_items ON outlet_items.outlet_id = ci.outlet_id AND outlet_items.item_id = ci.item_id
     WHERE ci.campaign_id = ?
     ORDER BY ci.id ASC`
  );
  const deleteCampaignItemsStmt = db.prepare("DELETE FROM campaign_items WHERE campaign_id = ?");
  const insertCampaignItemStmt = db.prepare(
    `INSERT INTO campaign_items
       (campaign_id, outlet_id, item_id, qty, required, discount_type, discount_value)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const expireCampaigns = () => {
    const now = nowIso();
    db.prepare(
      `UPDATE campaigns
       SET status = 'expired',
           updated_at = @now
       WHERE end_at IS NOT NULL
         AND end_at < @now
         AND status IN ('draft','active','paused')`
    ).run({ now });
  };

  const fetchCampaignItems = (campaignId) => campaignItemsStmt.all(campaignId).map((row) => ({
    id: row.id,
    item_id: row.item_id,
    qty: row.qty,
    required: !!row.required,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    title: row.title,
    base_price: row.base_price ?? null
  }));

  const formatCampaign = (row, { items = [] } = {}) => ({
    id: row.id,
    outlet_id: row.outlet_id,
    type: row.type,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    start_at: row.start_at,
    end_at: row.end_at,
    active_days: parseJsonArray(row.active_days),
    active_hours: parseJsonValue(row.active_hours, null),
    min_order_amount: row.min_order_amount,
    max_uses_total: row.max_uses_total,
    max_uses_per_client: row.max_uses_per_client,
    delivery_methods: parseJsonArray(row.delivery_methods),
    stoplist_policy: row.stoplist_policy,
    bundle_fixed_price: row.bundle_fixed_price,
    bundle_percent_discount: row.bundle_percent_discount,
    created_by_role: row.created_by_role,
    created_by_tg_id: row.created_by_tg_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    archived_at: row.archived_at,
    items,
    items_count: row.items_count ?? undefined
  });

  const getCampaignSnapshot = (row, items) => formatCampaign(row, { items });

  const fetchOutletPrices = (outletId, itemIds) => {
    if (!itemIds.length) {
      return new Map();
    }
    const placeholders = itemIds.map(() => "?").join(", ");
    const statement = db.prepare(
      `SELECT item_id, base_price
       FROM outlet_items
       WHERE outlet_id = ?
         AND item_id IN (${placeholders})`
    );
    const rows = statement.all(outletId, ...itemIds);
    const map = new Map();
    rows.forEach((row) => {
      map.set(row.item_id, row.base_price ?? 0);
    });
    return map;
  };

  const buildCampaignPayload = ({ body, outletId, existing, existingItems }) => {
    const warnings = [];
    const title = (body.title ?? existing?.title ?? "").trim();
    if (!title) {
      return { error: "Title is required" };
    }
    const type = (body.type ?? existing?.type ?? "discount").toLowerCase();
    if (!CAMPAIGN_TYPES.has(type)) {
      return { error: "Invalid campaign type" };
    }
    const status = (body.status ?? existing?.status ?? "draft").toLowerCase();
    if (!CAMPAIGN_STATUSES.has(status)) {
      return { error: "Invalid status" };
    }
    const priority = sanitizeToInteger(body.priority ?? existing?.priority ?? 0);
    const minOrderAmount = sanitizeToInteger(body.min_order_amount ?? existing?.min_order_amount ?? 0);
    const maxUsesTotal = sanitizeToInteger(body.max_uses_total ?? existing?.max_uses_total ?? 0);
    const maxUsesPerClient = sanitizeToInteger(
      body.max_uses_per_client ?? existing?.max_uses_per_client ?? 0
    );
    if (maxUsesPerClient < 0 || maxUsesTotal < 0 || minOrderAmount < 0) {
      return { error: "Limits must be zero or positive" };
    }
    const stoplist = (body.stoplist_policy ?? existing?.stoplist_policy ?? "hide").toLowerCase();
    if (!STOPLIST_POLICIES.has(stoplist)) {
      return { error: "Invalid stoplist policy" };
    }
    const activeDays = normalizeArrayField(
      body.active_days,
      parseJsonArray(existing?.active_days)
    );
    const activeHours = normalizeObjectField(
      body.active_hours,
      parseJsonValue(existing?.active_hours, null)
    );
    const deliveryMethods = normalizeMethods(
      body.delivery_methods,
      parseJsonArray(existing?.delivery_methods)
    );
    const startAt = body.start_at ?? existing?.start_at ?? null;
    const endAt = body.end_at ?? existing?.end_at ?? null;
    if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
      return { error: "start_at must be before end_at" };
    }
    const itemsPayload = Array.isArray(body.items)
      ? body.items
      : existingItems && existingItems.length
        ? existingItems
        : [];
    if (!itemsPayload.length) {
      return { error: "At least one item is required" };
    }
    const seen = new Set();
    const sanitizedItems = [];
    const itemIds = [];
    for (const row of itemsPayload) {
      const itemId = Number(row.item_id ?? row.itemId ?? row.id);
      if (!itemId) {
        return { error: "Item id is required" };
      }
      if (seen.has(itemId)) {
        return { error: "Each item must be unique" };
      }
      seen.add(itemId);
      itemIds.push(itemId);
      const qty = sanitizeToInteger(row.qty ?? row.quantity ?? 1, 1);
      if (qty < 1) {
        return { error: "Item quantity must be at least 1" };
      }
      const required = toBooleanInt(row.required ?? row.is_required ?? 1);
      const discountType = (row.discount_type ?? row.type ?? "percent").toLowerCase();
      if (!DISCOUNT_TYPES.has(discountType)) {
        return { error: "Invalid discount type" };
      }
      const discountValue = sanitizeToInteger(row.discount_value ?? row.value ?? 0, 0);
      sanitizedItems.push({
        item_id: itemId,
        qty,
        required,
        discount_type: discountType,
        discount_value: discountValue
      });
    }
    const basePrices = fetchOutletPrices(outletId, itemIds);
    let missing = null;
    let itemSum = 0;
    sanitizedItems.forEach((item) => {
      if (!basePrices.has(item.item_id)) {
        missing = item.item_id;
      }
      const base = basePrices.get(item.item_id) ?? 0;
      itemSum += base * item.qty;
    });
    if (missing) {
      return { error: `Item ${missing} is not available for this outlet` };
    }

    let bundleFixed = body.bundle_fixed_price ?? existing?.bundle_fixed_price ?? null;
    let bundlePercent =
      body.bundle_percent_discount ?? existing?.bundle_percent_discount ?? null;
    bundleFixed = bundleFixed === null || bundleFixed === undefined ? null : Number(bundleFixed);
    bundlePercent =
      bundlePercent === null || bundlePercent === undefined
        ? null
        : Number(bundlePercent);
    if (type === "bundle") {
      if (bundleFixed !== null && bundlePercent !== null) {
        return { error: "Bundle campaigns must specify only one pricing rule" };
      }
      if (bundleFixed === null && bundlePercent === null) {
        return { error: "Bundle campaigns require a fixed price or percent discount" };
      }
      if (bundleFixed !== null) {
        if (Number.isNaN(bundleFixed) || bundleFixed <= 0) {
          return { error: "Bundle fixed price must be a positive number" };
        }
        if (itemSum > 0 && bundleFixed > itemSum) {
          return { error: "Bundle price must be lower than the sum of items" };
        }
        if (itemSum > 0 && bundleFixed === itemSum) {
          warnings.push("Bundle price equals sum of items");
        }
      }
      if (bundlePercent !== null) {
        if (Number.isNaN(bundlePercent) || bundlePercent <= 0 || bundlePercent >= 100) {
          return { error: "Bundle percent discount must be between 1 and 99" };
        }
        if (itemSum > 0 && Math.round((itemSum * (100 - bundlePercent)) / 100) > itemSum) {
          return { error: "Bundle percent must produce an actual discount" };
        }
        if (itemSum > 0 && Math.round((itemSum * (100 - bundlePercent)) / 100) === itemSum) {
          warnings.push("Bundle percent discount produces no benefit");
        }
      }
    } else {
      bundleFixed = null;
      bundlePercent = null;
    }

    if (itemSum === 0 && type === "bundle") {
      return { error: "Bundle items must have prices assigned" };
    }

    const fields = {
      type,
      title,
      description: body.description ?? existing?.description ?? null,
      priority,
      status,
      start_at: startAt,
      end_at: endAt,
      active_days: arrayToJson(activeDays),
      active_hours: serializeJson(activeHours),
      min_order_amount: minOrderAmount,
      max_uses_total: maxUsesTotal,
      max_uses_per_client: maxUsesPerClient,
      delivery_methods: deliveryMethods,
      stoplist_policy: stoplist,
      bundle_fixed_price: bundleFixed,
      bundle_percent_discount: bundlePercent
    };

    return {
      fields,
      items: sanitizedItems,
      warnings
    };
  };

  const isTransitionAllowed = (current, next) => {
    if (current === next) return true;
    const allowed = {
      draft: new Set(["active", "paused", "archived"]),
      active: new Set(["paused", "archived"]),
      paused: new Set(["active", "archived"]),
      expired: new Set(["archived"]),
      archived: new Set([])
    };
    return allowed[current]?.has(next) ?? false;
  };

  const buildFilterClause = (outletId, filters = {}) => {
    const conditions = ["c.outlet_id = @outlet_id", "c.archived_at IS NULL"];
    const params = { outlet_id: outletId };
    if (filters.status && CAMPAIGN_STATUSES.has(filters.status)) {
      conditions.push("c.status = @status");
      params.status = filters.status;
    }
    if (filters.type && CAMPAIGN_TYPES.has(filters.type)) {
      conditions.push("c.type = @type");
      params.type = filters.type;
    }
    if (filters.q) {
      conditions.push("(c.title LIKE @q OR c.description LIKE @q)");
      params.q = `%${filters.q}%`;
    }
    const clause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return { clause, params };
  };

  app.get(
    "/api/outlets/:outletId/campaigns",
    requireRole(["admin", "support", "operator", "read-only"]),
    (req, res) => {
      expireCampaigns();
      const outletId = Number(req.params.outletId);
      if (Number.isNaN(outletId)) {
        return res.status(400).json({ error: "Invalid outlet id" });
      }
      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
      const offset = (page - 1) * limit;
      const { clause, params } = buildFilterClause(outletId, {
        status: req.query.status,
        type: req.query.type,
        q: req.query.q
      });
      const sort = parseSort(
        req.query.sort,
        {
          priority: "c.priority",
          start_at: "c.start_at",
          end_at: "c.end_at",
          created_at: "c.created_at"
        },
        "c.priority DESC, c.created_at DESC"
      );
      const rows = db
        .prepare(
          `SELECT c.*, COUNT(ci.id) AS items_count
           FROM campaigns c
           LEFT JOIN campaign_items ci ON ci.campaign_id = c.id
           ${clause}
           GROUP BY c.id
           ORDER BY ${sort}
           LIMIT @limit OFFSET @offset`
        )
        .all({ ...params, limit, offset });
      const total = db
        .prepare(`SELECT COUNT(*) as total FROM campaigns c ${clause}`)
        .get(params).total;
      const data = rows.map((row) => formatCampaign(row));
      return res.json({ items: data, page, limit, total });
    }
  );

  const persistCampaignItems = (campaignId, outletId, items) => {
    deleteCampaignItemsStmt.run(campaignId);
    items.forEach((item) => {
      insertCampaignItemStmt.run(
        campaignId,
        outletId,
        item.item_id,
        item.qty,
        item.required,
        item.discount_type,
        item.discount_value
      );
    });
  };

  const loadCampaignSnapshot = (id) => {
    const row = campaignByIdStmt.get(id);
    if (!row) {
      return null;
    }
    const items = fetchCampaignItems(id);
    return { row, items, snapshot: formatCampaign(row, { items }) };
  };

  const auditCampaign = (id, action, before, after, req) => {
    logAudit({
      entity_type: "campaign",
      entity_id: id,
      action,
      actor_id: getActorId(req),
      before: before ? getCampaignSnapshot(before.row, before.items) : null,
      after: after ? getCampaignSnapshot(after.row, after.items) : null
    });
  };

  app.post(
    "/api/outlets/:outletId/campaigns",
    requireRole(["admin"]),
    (req, res) => {
      const outletId = Number(req.params.outletId);
      if (Number.isNaN(outletId)) {
        return res.status(400).json({ error: "Invalid outlet id" });
      }
      const payload = buildCampaignPayload({ body: req.body, outletId });
      if (payload.error) {
        return res.status(400).json({ error: payload.error });
      }
      const id = crypto.randomUUID();
      const now = nowIso();
      const createdByRole = String(req.header("x-role") || "support").toLowerCase();
      const createdByTg = req.header("x-actor-tg") ?? null;
      insertCampaignStmt.run({
        id,
        outlet_id: outletId,
        created_by_role: createdByRole,
        created_by_tg_id: createdByTg,
        created_at: now,
        updated_at: now,
        archived_at: null,
        ...payload.fields
      });
      persistCampaignItems(id, outletId, payload.items);
      const result = loadCampaignSnapshot(id);
      auditCampaign(id, "create", null, result, req);
      return res.status(201).json(result.snapshot);
    }
  );

  app.get(
    "/api/campaigns/:id",
    requireRole(["admin", "support", "operator", "read-only"]),
    (req, res) => {
      expireCampaigns();
      const snapshot = loadCampaignSnapshot(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      return res.json(snapshot.snapshot);
    }
  );

  app.patch("/api/campaigns/:id", requireRole(["admin"]), (req, res) => {
    const snapshot = loadCampaignSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    if (snapshot.row.status === "archived") {
      return res.status(400).json({ error: "Archived campaigns cannot be edited" });
    }
    if (req.body.status && !isTransitionAllowed(snapshot.row.status, req.body.status)) {
      return res.status(400).json({ error: "Invalid status transition" });
    }
    const payload = buildCampaignPayload({
      body: req.body,
      outletId: snapshot.row.outlet_id,
      existing: snapshot.row,
      existingItems: snapshot.items
    });
    if (payload.error) {
      return res.status(400).json({ error: payload.error });
    }
    const now = nowIso();
    updateCampaignStmt.run({
      id: snapshot.row.id,
      updated_at: now,
      ...payload.fields
    });
    persistCampaignItems(snapshot.row.id, snapshot.row.outlet_id, payload.items);
    const updated = loadCampaignSnapshot(snapshot.row.id);
    auditCampaign(snapshot.row.id, "update", snapshot, updated, req);
    return res.json(updated.snapshot);
  });

  app.post("/api/campaigns/:id/activate", requireRole(["admin"]), (req, res) => {
    try {
      const snapshot = loadCampaignSnapshot(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (!isTransitionAllowed(snapshot.row.status, "active")) {
        return res.status(409).json({ error: "Invalid status transition" });
      }
      const now = nowIso();
      if (snapshot.row.end_at && new Date(snapshot.row.end_at) < new Date(now)) {
        db.prepare(
          `UPDATE campaigns
           SET status = 'expired',
               updated_at = @now
           WHERE id = ?`
        ).run(now, snapshot.row.id);
        return res.status(409).json({ error: "Campaign already expired" });
      }
      db.prepare(
        `UPDATE campaigns
         SET status = 'active',
             start_at = COALESCE(start_at, @now),
             updated_at = @now
         WHERE id = ?`
      ).run(now, snapshot.row.id);
      const updated = loadCampaignSnapshot(snapshot.row.id);
      auditCampaign(snapshot.row.id, "activate", snapshot, updated, req);
      return res.json(updated.snapshot);
    } catch (error) {
      return res.status(500).json({ error: "Failed to activate campaign" });
    }
  });

  app.post("/api/campaigns/:id/pause", requireRole(["admin"]), (req, res) => {
    try {
      const snapshot = loadCampaignSnapshot(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (!isTransitionAllowed(snapshot.row.status, "paused")) {
        return res.status(409).json({ error: "Invalid status transition" });
      }
      const now = nowIso();
      db.prepare(
        `UPDATE campaigns
         SET status = 'paused',
             updated_at = @now
         WHERE id = ?`
      ).run(now, snapshot.row.id);
      const updated = loadCampaignSnapshot(snapshot.row.id);
      auditCampaign(snapshot.row.id, "pause", snapshot, updated, req);
      return res.json(updated.snapshot);
    } catch (error) {
      return res.status(500).json({ error: "Failed to pause campaign" });
    }
  });

  app.delete("/api/campaigns/:id", requireRole(["admin"]), (req, res) => {
    const snapshot = loadCampaignSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    if (snapshot.row.status === "archived") {
      return res.status(204).send();
    }
    const now = nowIso();
    db.prepare(
      `UPDATE campaigns
       SET status = 'archived',
           archived_at = @now,
           updated_at = @now
       WHERE id = ?`
    ).run(now, snapshot.row.id);
    const updated = loadCampaignSnapshot(snapshot.row.id);
    auditCampaign(snapshot.row.id, "archive", snapshot, updated, req);
    return res.status(204).send();
  });

  app.post("/api/campaigns/:id/duplicate", requireRole(["admin"]), (req, res) => {
    const snapshot = loadCampaignSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    const now = nowIso();
    const newId = crypto.randomUUID();
    insertCampaignStmt.run({
      id: newId,
      outlet_id: snapshot.row.outlet_id,
      type: snapshot.row.type,
      title: `${snapshot.row.title} (Copy)`,
      description: snapshot.row.description,
      priority: snapshot.row.priority,
      status: "draft",
      start_at: snapshot.row.start_at,
      end_at: snapshot.row.end_at,
      active_days: snapshot.row.active_days,
      active_hours: snapshot.row.active_hours,
      min_order_amount: snapshot.row.min_order_amount,
      max_uses_total: snapshot.row.max_uses_total,
      max_uses_per_client: snapshot.row.max_uses_per_client,
      delivery_methods: snapshot.row.delivery_methods,
      stoplist_policy: snapshot.row.stoplist_policy,
      bundle_fixed_price: snapshot.row.bundle_fixed_price,
      bundle_percent_discount: snapshot.row.bundle_percent_discount,
      created_by_role: snapshot.row.created_by_role,
      created_by_tg_id: snapshot.row.created_by_tg_id,
      created_at: now,
      updated_at: now,
      archived_at: null
    });
    persistCampaignItems(newId, snapshot.row.outlet_id, snapshot.items);
    const duplicated = loadCampaignSnapshot(newId);
    auditCampaign(snapshot.row.id, "duplicate", snapshot, duplicated, req);
    return res.status(201).json(duplicated.snapshot);
  });

  app.get("/api/campaigns/:id/orders", requireRole(["admin"]), (req, res) => {
    const snapshot = loadCampaignSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const offset = (page - 1) * limit;
    const ledger = db.prepare(
      `SELECT cu.*, orders.order_number, orders.status AS order_status, orders.client_user_id
       FROM campaign_usage cu
       LEFT JOIN orders ON orders.id = cu.order_id
       WHERE cu.campaign_id = ?
       ORDER BY cu.applied_at DESC
       LIMIT ? OFFSET ?`
    );
    const usageRows = ledger.all(snapshot.row.id, limit, offset);
    const total = db
      .prepare("SELECT COUNT(*) as total FROM campaign_usage WHERE campaign_id = ?")
      .get(snapshot.row.id).total;
    return res.json({ items: usageRows, page, limit, total });
  });

  app.post(
    "/api/campaigns/:id/validate",
    requireRole(["admin", "support", "operator"]),
    (req, res) => {
      const snapshot = loadCampaignSnapshot(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      const payload = buildCampaignPayload({
        body: req.body,
        outletId: snapshot.row.outlet_id,
        existing: snapshot.row,
        existingItems: snapshot.items
      });
      if (payload.error) {
        return res.status(400).json({ error: payload.error });
      }
      return res.json({ valid: true, warnings: payload.warnings || [] });
    }
  );
};

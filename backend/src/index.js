import crypto from "crypto";
import express from "express";
import { initDb } from "./db.js";

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

const calcSlaDueAt = (prepEtaMinutes) =>
  prepEtaMinutes ? Date.now() + Number(prepEtaMinutes) * 60 * 1000 : null;

const SLA_CONFIG = {
  courier_search_sla_minutes: 10,
  cooking_sla_minutes: 20,
  delivery_sla_minutes: 45,
  pickup_after_ready_sla_minutes: 10
};

const MAX_BULK_ITEMS = 500;

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

const buildInClause = (items) => items.map(() => "?").join(", ");

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

const createPartnerStmt = db.prepare(
  "INSERT INTO partners (name, manager, status) VALUES (@name, @manager, @status)"
);
const updatePartnerStmt = db.prepare(
  `UPDATE partners
   SET name = COALESCE(@name, name),
       manager = COALESCE(@manager, manager),
       status = COALESCE(@status, status)
   WHERE id = @id`
);
const deletePartnerStmt = db.prepare("DELETE FROM partners WHERE id = ?");

const createOutletStmt = db.prepare(
  `INSERT INTO outlets (partner_id, type, name, address, is_active, status, hours, delivery_zone)
   VALUES (@partner_id, @type, @name, @address, @is_active, @status, @hours, @delivery_zone)`
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
       delivery_zone = COALESCE(@delivery_zone, delivery_zone)
   WHERE id = @id`
);
const deleteOutletStmt = db.prepare("DELETE FROM outlets WHERE id = ?");

const createCourierStmt = db.prepare(
  "INSERT INTO couriers (user_id, is_active, rating_avg, rating_count, phone) VALUES (@user_id, @is_active, @rating_avg, @rating_count, @phone)"
);
const updateCourierStmt = db.prepare(
  `UPDATE couriers
   SET is_active = COALESCE(@is_active, is_active),
       rating_avg = COALESCE(@rating_avg, rating_avg),
       rating_count = COALESCE(@rating_count, rating_count),
       phone = COALESCE(@phone, phone)
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
    "SELECT id, code, description, discount_percent, max_uses, used_count, is_active, created_at, starts_at, ends_at, min_order_amount, outlet_id, first_order_only FROM promo_codes";
  const { conditions, params } = buildFilters(filters);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY id";
  return db.prepare(sql).all(params);
};

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
       outlet_id = COALESCE(@outlet_id, outlet_id),
       first_order_only = COALESCE(@first_order_only, first_order_only)
   WHERE id = @id`
);
const deletePromoStmt = db.prepare("DELETE FROM promo_codes WHERE id = ?");

const listLedgerStmt = (filters) => {
  let sql =
    "SELECT id, title, amount, status, type, created_at, user_id, order_id, balance_delta, category FROM finance_ledger";
  const { conditions, params } = buildFilters(filters);
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY id DESC";
  return db.prepare(sql).all(params);
};
const createLedgerStmt = db.prepare(
  `INSERT INTO finance_ledger (title, amount, status, type, user_id, order_id, balance_delta, category)
   VALUES (@title, @amount, @status, @type, @user_id, @order_id, @balance_delta, @category)`
);
const updateLedgerStmt = db.prepare(
  `UPDATE finance_ledger
   SET title = COALESCE(@title, title),
       amount = COALESCE(@amount, amount),
       status = COALESCE(@status, status),
       type = COALESCE(@type, type),
       user_id = COALESCE(@user_id, user_id),
       order_id = COALESCE(@order_id, order_id),
       balance_delta = COALESCE(@balance_delta, balance_delta),
       category = COALESCE(@category, category)
   WHERE id = @id`
);
const deleteLedgerStmt = db.prepare("DELETE FROM finance_ledger WHERE id = ?");

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
      { label: "Баланс", value: balance },
      { label: "Выплаты", value: sumByType("courier_payout") },
      { label: "Штрафы", value: sumByType("penalty") },
      { label: "Бонусы", value: sumByType("bonus") }
    ];
  } else {
    summary = [
      { label: "Платежи", value: sumByType("payment") },
      { label: "Возвраты", value: sumByType("refund") },
      { label: "Промокоды", value: sumByType("promo") }
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
  if (!row) {
    return res.status(404).json({ error: "Client not found" });
  }
  res.json(row);
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
      clause: "(partners.name LIKE @q OR partners.manager LIKE @q)",
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
  let sql = "SELECT id, name, manager, status FROM partners";
  const { conditions, params } = buildFilters([
    {
      value: q ? `%${q}%` : null,
      clause: "(name LIKE @q OR manager LIKE @q)",
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
    status: req.body.status ?? "active"
  });
  const partner = db
    .prepare("SELECT id, name, manager, status FROM partners WHERE id = ?")
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
    .prepare("SELECT id, name, manager, status FROM partners WHERE id = ?")
    .get(id);
  if (!partner) {
    return res.status(404).json({ error: "Partner not found" });
  }
  updatePartnerStmt.run({
    id,
    name: req.body.name ?? null,
    manager: req.body.manager ?? null,
    status: req.body.status ?? null
  });
  const updated = db
    .prepare("SELECT id, name, manager, status FROM partners WHERE id = ?")
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
              outlets.delivery_zone
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

app.get("/api/outlets", (_req, res) => {
  const { q, type, partner_id } = _req.query;
  const partnerIdNumber = partner_id ? Number(partner_id) : null;
  let sql =
    "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone FROM outlets";
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
    delivery_zone: req.body.delivery_zone ?? null
  };
  const result = createOutletStmt.run(payload);
  const outlet = db
    .prepare(
      "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone FROM outlets WHERE id = ?"
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
      "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone FROM outlets WHERE id = ?"
    )
    .get(id);
  if (!outlet) {
    return res.status(404).json({ error: "Outlet not found" });
  }
  updateOutletStmt.run({
    id,
    partner_id: req.body.partner_id ?? null,
    type: req.body.type ?? null,
    name: req.body.name ?? null,
    address: req.body.address ?? null,
    is_active: req.body.is_active ?? null,
    status: req.body.status ?? null,
    hours: req.body.hours ?? null,
    delivery_zone: req.body.delivery_zone ?? null
  });
  const updated = db
    .prepare(
      "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone FROM outlets WHERE id = ?"
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
      "SELECT id, partner_id, type, name, address, is_active, status, hours, delivery_zone FROM outlets WHERE id = ?"
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
              items.category,
              items.sku,
              outlet_items.base_price,
              outlet_items.is_available,
              outlet_items.stock,
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
    return {
      itemId: row.item_id,
      title: row.title,
      category: row.category,
      sku: row.sku,
      basePrice,
      currentPrice: computeCurrentPrice(basePrice, campaign),
      isAvailable: row.is_available,
      stock: row.stock,
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

app.post("/api/outlets/:outletId/items/bulk", (req, res) => {
  const outletId = Number(req.params.outletId);
  const action = req.body.action;
  const reason = String(req.body.reason || "").trim();
  const params = req.body.params || {};
  const itemIds = Array.isArray(req.body.itemIds) ? req.body.itemIds.map(Number) : [];
  const uniqueIds = Array.from(new Set(itemIds.filter((id) => Number.isFinite(id))));

  if (!action) {
    return res.status(400).json({ error: "action required" });
  }
  const allowedActions = new Set([
    "setAvailability",
    "setPrice",
    "adjustPrice",
    "setStock",
    "addToCampaign"
  ]);
  if (!allowedActions.has(action)) {
    return res.status(400).json({ error: "Unsupported action" });
  }
  if (!reason) {
    return res.status(400).json({ error: "reason required" });
  }
  if (uniqueIds.length === 0) {
    return res.status(400).json({ error: "itemIds required" });
  }
  if (uniqueIds.length > MAX_BULK_ITEMS) {
    return res.status(400).json({ error: `Too many items (max ${MAX_BULK_ITEMS})` });
  }

  const role = getRole(req);
  const canEditPrice = role === "admin";
  const canEditAvailability = role === "admin" || role === "operator";

  if (["setPrice", "adjustPrice", "addToCampaign"].includes(action) && !canEditPrice) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (["setAvailability", "setStock"].includes(action) && !canEditAvailability) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const placeholders = buildInClause(uniqueIds);
  const rows = db
    .prepare(
      `SELECT item_id, base_price, is_available, stock
       FROM outlet_items
       WHERE outlet_id = ? AND item_id IN (${placeholders})`
    )
    .all(outletId, ...uniqueIds);

  const rowMap = new Map(rows.map((row) => [row.item_id, row]));
  const actorId = getActorId(req);
  const errors = [];
  let successCount = 0;

  const updateAvailabilityStmt = db.prepare(
    "UPDATE outlet_items SET is_available = ?, updated_at = ? WHERE outlet_id = ? AND item_id = ?"
  );
  const updatePriceStmt = db.prepare(
    "UPDATE outlet_items SET base_price = ?, updated_at = ? WHERE outlet_id = ? AND item_id = ?"
  );
  const updateStockStmt = db.prepare(
    "UPDATE outlet_items SET stock = ?, updated_at = ? WHERE outlet_id = ? AND item_id = ?"
  );
  const insertPriceHistoryStmt = db.prepare(
    `INSERT INTO outlet_item_price_history
     (outlet_id, item_id, old_price, new_price, changed_by_user_id, reason)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const upsertCampaignStmt = db.prepare(
    `INSERT INTO outlet_campaign_items (campaign_id, item_id, discount_type, discount_value)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(campaign_id, item_id)
     DO UPDATE SET discount_type = excluded.discount_type, discount_value = excluded.discount_value`
  );

  let campaignId = null;
  let campaignMap = new Map();
  if (action === "addToCampaign") {
    campaignId = Number(params.campaignId);
    const campaign = db
      .prepare(
        "SELECT id, status FROM outlet_campaigns WHERE id = ? AND outlet_id = ?"
      )
      .get(campaignId, outletId);
    if (!campaign || !["planned", "active"].includes(campaign.status)) {
      return res.status(400).json({ error: "Campaign not available" });
    }
    const campaignItems = db
      .prepare(
        `SELECT item_id, discount_type, discount_value
         FROM outlet_campaign_items
         WHERE campaign_id = ? AND item_id IN (${placeholders})`
      )
      .all(campaignId, ...uniqueIds);
    campaignMap = new Map(campaignItems.map((row) => [row.item_id, row]));
  }

  const perform = db.transaction(() => {
    uniqueIds.forEach((itemId) => {
      const row = rowMap.get(itemId);
      if (!row) {
        errors.push({ itemId, message: "Item not found in outlet" });
        return;
      }

      if (action === "setAvailability") {
        const isAvailable = typeof params.isAvailable === "boolean" ? params.isAvailable : null;
        if (isAvailable === null) {
          errors.push({ itemId, message: "isAvailable required" });
          return;
        }
        const next = isAvailable ? 1 : 0;
        if (next !== row.is_available) {
          updateAvailabilityStmt.run(next, nowIso(), outletId, itemId);
          logAudit({
            entity_type: "outlet_item",
            entity_id: `${outletId}:${itemId}`,
            action: "bulk_set_availability",
            actor_id: actorId,
            before: { is_available: row.is_available },
            after: { is_available: next, reason }
          });
        }
        successCount += 1;
        return;
      }

      if (action === "setPrice") {
        const basePrice = Number(params.basePrice);
        if (Number.isNaN(basePrice)) {
          errors.push({ itemId, message: "basePrice required" });
          return;
        }
        const next = Math.max(0, Math.round(basePrice));
        if (next !== Number(row.base_price)) {
          updatePriceStmt.run(next, nowIso(), outletId, itemId);
          insertPriceHistoryStmt.run(
            outletId,
            itemId,
            row.base_price,
            next,
            actorId,
            reason
          );
          logAudit({
            entity_type: "outlet_item",
            entity_id: `${outletId}:${itemId}`,
            action: "bulk_set_price",
            actor_id: actorId,
            before: { base_price: row.base_price },
            after: { base_price: next, reason }
          });
        }
        successCount += 1;
        return;
      }

      if (action === "adjustPrice") {
        const value = Number(params.value);
        const kind = params.kind;
        const direction = params.direction;
        if (Number.isNaN(value) || value <= 0) {
          errors.push({ itemId, message: "value required" });
          return;
        }
        if (!["increase", "decrease"].includes(direction)) {
          errors.push({ itemId, message: "direction required" });
          return;
        }
        const basePrice = Number(row.base_price || 0);
        let next = basePrice;
        if (kind === "percent") {
          const delta = Math.round(basePrice * (value / 100));
          next = direction === "decrease" ? basePrice - delta : basePrice + delta;
        } else if (kind === "fixed") {
          next = direction === "decrease" ? basePrice - value : basePrice + value;
        } else {
          errors.push({ itemId, message: "kind required" });
          return;
        }
        next = Math.max(0, Math.round(next));
        if (next !== basePrice) {
          updatePriceStmt.run(next, nowIso(), outletId, itemId);
          insertPriceHistoryStmt.run(
            outletId,
            itemId,
            row.base_price,
            next,
            actorId,
            reason
          );
          logAudit({
            entity_type: "outlet_item",
            entity_id: `${outletId}:${itemId}`,
            action: "bulk_adjust_price",
            actor_id: actorId,
            before: { base_price: row.base_price },
            after: { base_price: next, reason, kind, direction, value }
          });
        }
        successCount += 1;
        return;
      }

      if (action === "setStock") {
        const stock =
          params.stock === null || params.stock === undefined
            ? null
            : Number(params.stock);
        if (stock !== null && Number.isNaN(stock)) {
          errors.push({ itemId, message: "stock invalid" });
          return;
        }
        if (stock !== row.stock) {
          updateStockStmt.run(stock, nowIso(), outletId, itemId);
          logAudit({
            entity_type: "outlet_item",
            entity_id: `${outletId}:${itemId}`,
            action: "bulk_set_stock",
            actor_id: actorId,
            before: { stock: row.stock },
            after: { stock, reason }
          });
        }
        successCount += 1;
        return;
      }

      if (action === "addToCampaign") {
        const discountType = params.discount_type;
        const discountValue = Number(params.discount_value);
        if (!campaignId || !discountType || Number.isNaN(discountValue)) {
          errors.push({ itemId, message: "campaignId, discount_type, discount_value required" });
          return;
        }
        const existing = campaignMap.get(itemId);
        upsertCampaignStmt.run(campaignId, itemId, discountType, discountValue);
        logAudit({
          entity_type: "campaign_item",
          entity_id: `${campaignId}:${itemId}`,
          action: "bulk_add_to_campaign",
          actor_id: actorId,
          before: existing
            ? { discount_type: existing.discount_type, discount_value: existing.discount_value }
            : null,
          after: { discount_type: discountType, discount_value: discountValue, reason }
        });
        successCount += 1;
        return;
      }

      errors.push({ itemId, message: "Unsupported action" });
    });
  });

  perform();

  return res.json({
    successCount,
    errorCount: errors.length,
    errors: errors.length ? errors : undefined
  });
});

app.patch("/api/outlets/:outletId/items/:itemId", (req, res) => {
  const outletId = Number(req.params.outletId);
  const itemId = Number(req.params.itemId);
  const role = getRole(req);

  const outletItem = db
    .prepare(
      "SELECT base_price, is_available, stock FROM outlet_items WHERE outlet_id = ? AND item_id = ?"
    )
    .get(outletId, itemId);
  if (!outletItem) {
    return res.status(404).json({ error: "Outlet item not found" });
  }

  const canEditPrice = role === "admin";
  const canEditAvailability = role === "admin" || role === "operator";

  if (req.body.basePrice !== undefined && !canEditPrice) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if ((req.body.isAvailable !== undefined || req.body.stock !== undefined) && !canEditAvailability) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const newBasePrice =
    req.body.basePrice !== undefined ? Number(req.body.basePrice) : null;
  const isAvailable =
    req.body.isAvailable !== undefined ? (req.body.isAvailable ? 1 : 0) : null;
  const stock =
    req.body.stock !== undefined ? Number(req.body.stock) : null;

  db.prepare(
    `UPDATE outlet_items
     SET base_price = COALESCE(@base_price, base_price),
         is_available = COALESCE(@is_available, is_available),
         stock = COALESCE(@stock, stock),
         updated_at = @updated_at
     WHERE outlet_id = @outlet_id AND item_id = @item_id`
  ).run({
    base_price: newBasePrice,
    is_available: isAvailable,
    stock,
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

  const updated = db
    .prepare(
      "SELECT outlet_id, item_id, base_price, is_available, stock, updated_at FROM outlet_items WHERE outlet_id = ? AND item_id = ?"
    )
    .get(outletId, itemId);
  res.json(updated);
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

app.get("/api/outlets/:outletId/campaigns", (req, res) => {
  const outletId = Number(req.params.outletId);
  const rows = db
    .prepare(
      `SELECT outlet_campaigns.id,
              outlet_campaigns.title,
              outlet_campaigns.status,
              outlet_campaigns.start_at,
              outlet_campaigns.end_at,
              outlet_campaigns.created_at,
              outlet_campaigns.updated_at,
              COUNT(outlet_campaign_items.item_id) as items_count
       FROM outlet_campaigns
       LEFT JOIN outlet_campaign_items ON outlet_campaign_items.campaign_id = outlet_campaigns.id
       WHERE outlet_campaigns.outlet_id = ?
       GROUP BY outlet_campaigns.id
       ORDER BY outlet_campaigns.created_at DESC`
    )
    .all(outletId);
  res.json(rows);
});

app.post("/api/outlets/:outletId/campaigns", requireRole(["admin"]), (req, res) => {
  const outletId = Number(req.params.outletId);
  const title = req.body.title;
  if (!title) {
    return res.status(400).json({ error: "title required" });
  }
  const result = db
    .prepare(
      `INSERT INTO outlet_campaigns
       (outlet_id, title, status, start_at, end_at, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      outletId,
      title,
      "planned",
      req.body.start_at ?? null,
      req.body.end_at ?? null,
      getActorId(req),
      nowIso(),
      nowIso()
    );
  const campaign = db
    .prepare(
      `SELECT id, outlet_id, title, status, start_at, end_at, created_at, updated_at
       FROM outlet_campaigns WHERE id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json(campaign);
});

app.patch("/api/outlets/:outletId/campaigns/:campaignId", requireRole(["admin"]), (req, res) => {
  const outletId = Number(req.params.outletId);
  const campaignId = Number(req.params.campaignId);
  const campaign = db
    .prepare("SELECT id FROM outlet_campaigns WHERE id = ? AND outlet_id = ?")
    .get(campaignId, outletId);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found" });
  }
  db.prepare(
    `UPDATE outlet_campaigns
     SET title = COALESCE(@title, title),
         start_at = COALESCE(@start_at, start_at),
         end_at = COALESCE(@end_at, end_at),
         updated_at = @updated_at
     WHERE id = @id`
  ).run({
    id: campaignId,
    title: req.body.title ?? null,
    start_at: req.body.start_at ?? null,
    end_at: req.body.end_at ?? null,
    updated_at: nowIso()
  });
  const updated = db
    .prepare(
      `SELECT id, outlet_id, title, status, start_at, end_at, created_at, updated_at
       FROM outlet_campaigns WHERE id = ?`
    )
    .get(campaignId);
  res.json(updated);
});

app.post("/api/outlets/:outletId/campaigns/:campaignId/activate", requireRole(["admin"]), (req, res) => {
  const campaignId = Number(req.params.campaignId);
  db.prepare(
    `UPDATE outlet_campaigns
     SET status = 'active',
         start_at = COALESCE(start_at, @start_at),
         updated_at = @updated_at
     WHERE id = ?`
  ).run({ start_at: nowIso(), updated_at: nowIso(), 0: campaignId });
  res.json({ id: campaignId, status: "active" });
});

app.post("/api/outlets/:outletId/campaigns/:campaignId/end", requireRole(["admin", "operator"]), (req, res) => {
  const campaignId = Number(req.params.campaignId);
  db.prepare(
    `UPDATE outlet_campaigns
     SET status = 'ended',
         end_at = COALESCE(end_at, @end_at),
         updated_at = @updated_at
     WHERE id = ?`
  ).run({ end_at: nowIso(), updated_at: nowIso(), 0: campaignId });
  res.json({ id: campaignId, status: "ended" });
});

app.get("/api/outlets/:outletId/campaigns/:campaignId/items", (req, res) => {
  const campaignId = Number(req.params.campaignId);
  const rows = db
    .prepare(
      `SELECT outlet_campaign_items.item_id,
              outlet_campaign_items.discount_type,
              outlet_campaign_items.discount_value,
              items.title,
              outlet_items.base_price
       FROM outlet_campaign_items
       JOIN items ON items.id = outlet_campaign_items.item_id
       LEFT JOIN outlet_items ON outlet_items.item_id = outlet_campaign_items.item_id
       WHERE outlet_campaign_items.campaign_id = ?`
    )
    .all(campaignId);
  const items = rows.map((row) => ({
    itemId: row.item_id,
    title: row.title,
    basePrice: row.base_price,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    currentPrice: computeCurrentPrice(Number(row.base_price || 0), row)
  }));
  res.json(items);
});

app.post("/api/outlets/:outletId/campaigns/:campaignId/items/bulk", (req, res) => {
  const outletId = Number(req.params.outletId);
  const campaignId = Number(req.params.campaignId);
  const action = req.body.action;
  const reason = String(req.body.reason || "").trim();
  const params = req.body.params || {};
  const itemIds = Array.isArray(req.body.itemIds) ? req.body.itemIds.map(Number) : [];
  const uniqueIds = Array.from(new Set(itemIds.filter((id) => Number.isFinite(id))));

  if (!action) {
    return res.status(400).json({ error: "action required" });
  }
  const allowedActions = new Set(["updateDiscount", "removeItems"]);
  if (!allowedActions.has(action)) {
    return res.status(400).json({ error: "Unsupported action" });
  }
  if (!reason) {
    return res.status(400).json({ error: "reason required" });
  }
  if (uniqueIds.length === 0) {
    return res.status(400).json({ error: "itemIds required" });
  }
  if (uniqueIds.length > MAX_BULK_ITEMS) {
    return res.status(400).json({ error: `Too many items (max ${MAX_BULK_ITEMS})` });
  }

  const role = getRole(req);
  if (!["admin", "operator"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const campaign = db
    .prepare("SELECT id FROM outlet_campaigns WHERE id = ? AND outlet_id = ?")
    .get(campaignId, outletId);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const placeholders = buildInClause(uniqueIds);
  const rows = db
    .prepare(
      `SELECT item_id, discount_type, discount_value
       FROM outlet_campaign_items
       WHERE campaign_id = ? AND item_id IN (${placeholders})`
    )
    .all(campaignId, ...uniqueIds);
  const rowMap = new Map(rows.map((row) => [row.item_id, row]));
  const actorId = getActorId(req);
  const errors = [];
  let successCount = 0;

  const updateDiscountStmt = db.prepare(
    `UPDATE outlet_campaign_items
     SET discount_type = COALESCE(@discount_type, discount_type),
         discount_value = COALESCE(@discount_value, discount_value)
     WHERE campaign_id = @campaign_id AND item_id = @item_id`
  );
  const deleteItemStmt = db.prepare(
    "DELETE FROM outlet_campaign_items WHERE campaign_id = ? AND item_id = ?"
  );

  const perform = db.transaction(() => {
    uniqueIds.forEach((itemId) => {
      const row = rowMap.get(itemId);
      if (!row) {
        errors.push({ itemId, message: "Item not in campaign" });
        return;
      }

      if (action === "updateDiscount") {
        const nextType = params.discount_type ?? row.discount_type;
        const nextValue = params.discount_value;
        if (nextValue === undefined || Number.isNaN(Number(nextValue))) {
          errors.push({ itemId, message: "discount_value required" });
          return;
        }
        updateDiscountStmt.run({
          campaign_id: campaignId,
          item_id: itemId,
          discount_type: nextType,
          discount_value: Number(nextValue)
        });
        logAudit({
          entity_type: "campaign_item",
          entity_id: `${campaignId}:${itemId}`,
          action: "bulk_update_discount",
          actor_id: actorId,
          before: { discount_type: row.discount_type, discount_value: row.discount_value },
          after: { discount_type: nextType, discount_value: Number(nextValue), reason }
        });
        successCount += 1;
        return;
      }

      if (action === "removeItems") {
        deleteItemStmt.run(campaignId, itemId);
        logAudit({
          entity_type: "campaign_item",
          entity_id: `${campaignId}:${itemId}`,
          action: "bulk_remove_from_campaign",
          actor_id: actorId,
          before: { discount_type: row.discount_type, discount_value: row.discount_value },
          after: { removed: true, reason }
        });
        successCount += 1;
      }
    });
  });

  perform();

  return res.json({
    successCount,
    errorCount: errors.length,
    errors: errors.length ? errors : undefined
  });
});

app.post("/api/outlets/:outletId/campaigns/:campaignId/items", requireRole(["admin"]), (req, res) => {
  const outletId = Number(req.params.outletId);
  const campaignId = Number(req.params.campaignId);
  const itemId = Number(req.body.item_id);
  const discountType = req.body.discount_type;
  const discountValue = Number(req.body.discount_value);
  if (!itemId || !discountType || !discountValue) {
    return res.status(400).json({ error: "item_id, discount_type, discount_value required" });
  }

  const outletItem = db
    .prepare("SELECT item_id FROM outlet_items WHERE outlet_id = ? AND item_id = ?")
    .get(outletId, itemId);
  if (!outletItem) {
    return res.status(400).json({ error: "Item not in outlet menu" });
  }

  db.prepare(
    `INSERT INTO outlet_campaign_items (campaign_id, item_id, discount_type, discount_value)
     VALUES (@campaign_id, @item_id, @discount_type, @discount_value)
     ON CONFLICT(campaign_id, item_id)
     DO UPDATE SET discount_type = excluded.discount_type, discount_value = excluded.discount_value`
  ).run({
    campaign_id: campaignId,
    item_id: itemId,
    discount_type: discountType,
    discount_value: discountValue
  });

  res.status(201).json({ item_id: itemId });
});

app.patch("/api/outlets/:outletId/campaigns/:campaignId/items/:itemId", requireRole(["admin"]), (req, res) => {
  const campaignId = Number(req.params.campaignId);
  const itemId = Number(req.params.itemId);
  db.prepare(
    `UPDATE outlet_campaign_items
     SET discount_type = COALESCE(@discount_type, discount_type),
         discount_value = COALESCE(@discount_value, discount_value)
     WHERE campaign_id = @campaign_id AND item_id = @item_id`
  ).run({
    campaign_id: campaignId,
    item_id: itemId,
    discount_type: req.body.discount_type ?? null,
    discount_value: req.body.discount_value ?? null
  });
  res.json({ item_id: itemId });
});

app.delete("/api/outlets/:outletId/campaigns/:campaignId/items/:itemId", requireRole(["admin"]), (req, res) => {
  const campaignId = Number(req.params.campaignId);
  const itemId = Number(req.params.itemId);
  db.prepare(
    "DELETE FROM outlet_campaign_items WHERE campaign_id = ? AND item_id = ?"
  ).run(campaignId, itemId);
  res.status(204).send();
});

app.get("/api/couriers", (_req, res) => {
  const { status, q } = _req.query;
  const qNumber = q ? Number(q) : null;
  let sql =
    "SELECT user_id, is_active, rating_avg, rating_count, phone FROM couriers";
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
    phone: req.body.phone ?? null
  };
  createCourierStmt.run(payload);
  const courier = db
    .prepare(
      "SELECT user_id, is_active, rating_avg, rating_count, phone FROM couriers WHERE user_id = ?"
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
    .prepare("SELECT user_id, is_active, rating_avg, rating_count, phone FROM couriers WHERE user_id = ?")
    .get(userId);
  if (!courier) {
    return res.status(404).json({ error: "Courier not found" });
  }
  updateCourierStmt.run({
    user_id: userId,
    is_active: req.body.is_active ?? null,
    rating_avg: req.body.rating_avg ?? null,
    rating_count: req.body.rating_count ?? null,
    phone: req.body.phone ?? null
  });
  const updated = db
    .prepare(
      "SELECT user_id, is_active, rating_avg, rating_count, phone FROM couriers WHERE user_id = ?"
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
              couriers.phone
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
              orders.total_amount,
              orders.delivery_address,
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
  res.json({
    ...row,
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

app.post("/api/orders/:id/cancel", requireRole(["admin", "support", "operator"]), (req, res) => {
  const id = Number(req.params.id);
  const order = getOrderStmt.get(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const before = { ...order };
  updateOrderStmt.run({
    id,
    status: "cancelled",
    courier_user_id: null,
    prep_eta_minutes: null,
    total_amount: null,
    delivery_address: null
  });
  logOrderEvent({
    order_id: id,
    type: "cancelled",
    payload: { reason: req.body?.reason || null },
    actor_id: getActorId(req)
  });
  const updated = getOrderStmt.get(id);
  logAudit({
    entity_type: "order",
    entity_id: id,
    action: "cancel",
    actor_id: getActorId(req),
    before,
    after: updated
  });
  res.json(updated);
});

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
      clause: "(code LIKE @q OR description LIKE @q)",
      paramName: "q"
    },
    {
      value:
        is_active !== undefined
          ? Number(is_active)
          : null,
      clause: "is_active = @is_active",
      paramName: "is_active"
    }
  ]);
  res.json(rows);
});

app.post("/api/promos", requireRole(["admin"]), (req, res) => {
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
    outlet_id: req.body.outlet_id ?? null,
    first_order_only: req.body.first_order_only ?? null
  };
  const result = createPromoStmt.run(payload);
  const promo = db
    .prepare(
      "SELECT id, code, description, discount_percent, max_uses, used_count, is_active, created_at, starts_at, ends_at, min_order_amount, outlet_id, first_order_only FROM promo_codes WHERE id = ?"
    )
    .get(result.lastInsertRowid);
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
  const promo = db
    .prepare(
      "SELECT id, code, description, discount_percent, max_uses, used_count, is_active, created_at, starts_at, ends_at, min_order_amount, outlet_id, first_order_only FROM promo_codes WHERE id = ?"
    )
    .get(id);
  if (!promo) {
    return res.status(404).json({ error: "Promo not found" });
  }
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
    outlet_id: req.body.outlet_id ?? null,
    first_order_only: req.body.first_order_only ?? null
  });
  const updated = db
    .prepare(
      "SELECT id, code, description, discount_percent, max_uses, used_count, is_active, created_at, starts_at, ends_at, min_order_amount, outlet_id, first_order_only FROM promo_codes WHERE id = ?"
    )
    .get(id);
  logAudit({
    entity_type: "promo",
    entity_id: id,
    action: "update",
    actor_id: getActorId(req),
    before: promo,
    after: updated
  });
  res.json(updated);
});

app.delete("/api/promos/:id", requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const promo = db
    .prepare(
      "SELECT id, code, description, discount_percent, max_uses, used_count, is_active, created_at, starts_at, ends_at, min_order_amount, outlet_id, first_order_only FROM promo_codes WHERE id = ?"
    )
    .get(id);
  deletePromoStmt.run(id);
  if (promo) {
    logAudit({
      entity_type: "promo",
      entity_id: id,
      action: "delete",
      actor_id: getActorId(req),
      before: promo,
      after: null
    });
  }
  res.status(204).send();
});

app.get("/api/promos/:id", (req, res) => {
  const id = Number(req.params.id);
  const promo = db
    .prepare(
      "SELECT id, code, description, discount_percent, max_uses, used_count, is_active, created_at, starts_at, ends_at, min_order_amount, outlet_id, first_order_only FROM promo_codes WHERE id = ?"
    )
    .get(id);
  if (!promo) {
    return res.status(404).json({ error: "Promo not found" });
  }
  res.json(promo);
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

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

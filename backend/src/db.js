import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const resolveDbPath = () => {
  const url = process.env.DATABASE_URL || "sqlite:./data/app.db";
  if (url.startsWith("sqlite:")) {
    return path.resolve(process.cwd(), url.replace("sqlite:", ""));
  }
  return path.resolve(process.cwd(), "./data/app.db");
};

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const runMigrations = (db) => {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)"
  );

  const migrationsDir = path.resolve(process.cwd(), "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const applied = new Set(
    db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row) => row.name)
  );

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(file);
  }
};

const seedClients = (db) => {
  const clientCount = db.prepare("SELECT COUNT(*) as count FROM clients").get();
  if (clientCount.count !== 0) {
    return;
  }
  const insertClient = db.prepare(
    "INSERT INTO clients (user_id, phone, full_name) VALUES (?, ?, ?)"
  );
  const clientsToCreate = db
    .prepare(
      "SELECT id, username FROM users WHERE role = 'client' AND id NOT IN (SELECT user_id FROM clients)"
    )
    .all();
  clientsToCreate.forEach((user) => {
    const name = user.username ? user.username.replace("@", "") : `Client ${user.id}`;
    const phone = `+998 90 ${String(user.id).padStart(3, "0")} 00 00`;
    insertClient.run(user.id, phone, name);
  });
};

const nowIso = () => new Date().toISOString();

const minutesAgo = (value) =>
  new Date(Date.now() - Number(value) * 60 * 1000).toISOString();

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const ensureTestData = (db) => {
  const desiredClients = 100;
  const desiredRestaurants = 5;
  const desiredShops = 3;
  const desiredOrders = 30;

  const insertUser = db.prepare(
    "INSERT INTO users (tg_id, username, status, role, updated_at, last_active) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertClient = db.prepare(
    "INSERT INTO clients (user_id, phone, full_name) VALUES (?, ?, ?)"
  );
  const insertPartner = db.prepare(
    "INSERT INTO partners (name, manager) VALUES (?, ?)"
  );
  const insertOutlet = db.prepare(
    "INSERT INTO outlets (partner_id, type, name, address, is_active) VALUES (?, ?, ?, ?, ?)"
  );

  const partnerIds = db.prepare("SELECT id FROM partners").all().map((row) => row.id);
  const needPartners = Math.max(0, 3 - partnerIds.length);
  for (let i = 0; i < needPartners; i += 1) {
    const idx = partnerIds.length + i + 1;
    const partnerId = insertPartner
      .run(`Test Partner ${idx}`, `@partner_${idx}`)
      .lastInsertRowid;
    partnerIds.push(partnerId);
  }

  const outlets = db.prepare("SELECT id, type FROM outlets").all();
  const restaurants = outlets.filter((row) => row.type === "restaurant");
  const shops = outlets.filter((row) => row.type === "shop");

  for (let i = restaurants.length; i < desiredRestaurants; i += 1) {
    const idx = i + 1;
    const partnerId = partnerIds[i % partnerIds.length];
    insertOutlet.run(
      partnerId,
      "restaurant",
      `Test Restaurant ${idx}`,
      `Restaurant st, ${10 + idx}`,
      1
    );
  }

  for (let i = shops.length; i < desiredShops; i += 1) {
    const idx = i + 1;
    const partnerId = partnerIds[(i + 1) % partnerIds.length];
    insertOutlet.run(
      partnerId,
      "shop",
      `Test Shop ${idx}`,
      `Market ave, ${30 + idx}`,
      1
    );
  }

  const clientUsers = db
    .prepare("SELECT id FROM users WHERE role = 'client'")
    .all()
    .map((row) => row.id);
  const clientIdsSet = new Set(
    db.prepare("SELECT user_id FROM clients").all().map((row) => row.user_id)
  );

  for (const id of clientUsers) {
    if (!clientIdsSet.has(id)) {
      const suffix = String(id).padStart(3, "0");
      insertClient.run(id, `+998 90 ${suffix} 00 00`, `Client ${id}`);
      clientIdsSet.add(id);
    }
  }

  const missingClients = Math.max(0, desiredClients - clientUsers.length);
  for (let i = 0; i < missingClients; i += 1) {
    const idx = clientUsers.length + i + 1;
    const tgId = `TG-C${String(idx).padStart(4, "0")}`;
    const username = `@client_${String(idx).padStart(3, "0")}`;
    const timestamp = nowIso();
    const userId = insertUser
      .run(tgId, username, "active", "client", timestamp, timestamp)
      .lastInsertRowid;
    insertClient.run(
      userId,
      `+998 90 ${String(idx).padStart(3, "0")} 00 00`,
      `Client ${idx}`
    );
    clientUsers.push(userId);
    clientIdsSet.add(userId);
  }

  const outletIds = db.prepare("SELECT id FROM outlets").all().map((row) => row.id);
  const clientIds = db
    .prepare("SELECT user_id FROM clients ORDER BY user_id ASC")
    .all()
    .map((row) => row.user_id);
  const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  const ordersToCreate = Math.max(0, desiredOrders - orderCount);

  if (ordersToCreate > 0 && outletIds.length && clientIds.length) {
    const insertOrder = db.prepare(
      `INSERT INTO orders (order_number, client_user_id, outlet_id, courier_user_id, status, total_amount, delivery_address, created_at, accepted_at, ready_at, picked_up_at, delivered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertEvent = db.prepare(
      "INSERT INTO order_events (order_id, type, payload, actor_id, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    const adminId =
      db.prepare("SELECT id FROM users WHERE role = 'admin'").get()?.id ?? null;
    const supportId =
      db.prepare("SELECT id FROM users WHERE role = 'support'").get()?.id ?? adminId;
    const courierId =
      db.prepare("SELECT id FROM users WHERE role = 'courier'").get()?.id ?? null;

    const addMinutes = (iso, minutes) =>
      new Date(Date.parse(iso) + minutes * 60 * 1000).toISOString();

    const statuses = [
      "delivered",
      "picked_up",
      "ready_for_pickup",
      "accepted_by_restaurant",
      "accepted_by_system"
    ];

    for (let i = 0; i < ordersToCreate; i += 1) {
      const status = statuses[i % statuses.length];
      const createdAt = minutesAgo(randomBetween(120, 2880));
      const orderNumber = `ORD-${3000 + orderCount + i + 1}`;
      const clientId = clientIds[(orderCount + i) % clientIds.length];
      const outletId = outletIds[(orderCount + i) % outletIds.length];
      const baseAmount = randomBetween(35000, 120000);
      const address = `Test st, ${randomBetween(10, 200)}`;

      let acceptedAt = null;
      let readyAt = null;
      let pickedUpAt = null;
      let deliveredAt = null;
      let orderCourier = courierId;

      if (status !== "accepted_by_system") {
        acceptedAt = addMinutes(createdAt, randomBetween(3, 8));
      } else {
        orderCourier = null;
      }

      if (["ready_for_pickup", "picked_up", "delivered"].includes(status)) {
        readyAt = addMinutes(
          acceptedAt,
          randomBetween(15, i % 6 === 0 ? 45 : 25)
        );
      }

      if (["picked_up", "delivered"].includes(status)) {
        pickedUpAt = addMinutes(
          readyAt,
          randomBetween(5, i % 5 === 0 ? 30 : 15)
        );
      }

      if (status === "delivered") {
        deliveredAt = addMinutes(
          pickedUpAt,
          randomBetween(15, i % 4 === 0 ? 70 : 35)
        );
      }

      const result = insertOrder.run(
        orderNumber,
        clientId,
        outletId,
        orderCourier,
        status,
        baseAmount,
        address,
        createdAt,
        acceptedAt,
        readyAt,
        pickedUpAt,
        deliveredAt
      );

      const orderId = result.lastInsertRowid;
      insertEvent.run(
        orderId,
        "created",
        JSON.stringify({ status }),
        adminId,
        createdAt
      );

      if (status === "accepted_by_system") {
        insertEvent.run(
          orderId,
          "courier_search_started",
          null,
          supportId,
          addMinutes(createdAt, 5)
        );
      }

      if (acceptedAt) {
        insertEvent.run(orderId, "accepted", null, supportId, acceptedAt);
      }
      if (readyAt) {
        insertEvent.run(orderId, "ready", null, supportId, readyAt);
      }
      if (pickedUpAt) {
        insertEvent.run(orderId, "picked_up", null, courierId, pickedUpAt);
      }
      if (deliveredAt) {
        insertEvent.run(orderId, "delivered", null, courierId, deliveredAt);
      }
    }
  }
};

const seedIfEmpty = (db) => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  const hasUsers = userCount.count > 0;
  if (!hasUsers) {
    // Primary seed for fresh database.
    const insertUser = db.prepare(
      "INSERT INTO users (tg_id, username, status, role, updated_at, last_active) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
    );
    const aziza = insertUser.run("TG-1021", "@aziza", "active", "client").lastInsertRowid;
    const jamshid = insertUser.run("TG-874", "@jamshid", "active", "courier").lastInsertRowid;
    const admin = insertUser.run("TG-322", "@admin", "active", "admin").lastInsertRowid;
    const support = insertUser.run("TG-500", "@support", "active", "support").lastInsertRowid;

    const insertPartner = db.prepare(
      "INSERT INTO partners (name, manager) VALUES (?, ?)"
    );
    const kungrad = insertPartner.run("Kungrad Foods", "@kungrad_admin").lastInsertRowid;
    const fresh = insertPartner.run("Fresh Market", "@fresh_ops").lastInsertRowid;

    const insertOutlet = db.prepare(
      "INSERT INTO outlets (partner_id, type, name, address, is_active) VALUES (?, ?, ?, ?, ?)"
    );
    const burger = insertOutlet.run(
      kungrad,
      "restaurant",
      "Burger Way",
      "Main st, 12",
      1
    ).lastInsertRowid;
    insertOutlet.run(
      fresh,
      "shop",
      "Green Market",
      "Central ave, 88",
      1
    );

    const itemCount = db.prepare("SELECT COUNT(*) as count FROM items").get();
    if (itemCount.count === 0) {
      const insertItem = db.prepare(
        "INSERT INTO items (title, sku, category, updated_at) VALUES (?, ?, ?, datetime('now'))"
      );
      const burgerItem = insertItem.run("Classic Burger", "BRG-001", "Burgers").lastInsertRowid;
      const friesItem = insertItem.run("French Fries", "SID-101", "Sides").lastInsertRowid;
      const saladItem = insertItem.run("Fresh Salad", "SAL-204", "Salads").lastInsertRowid;

      const insertOutletItem = db.prepare(
        "INSERT INTO outlet_items (outlet_id, item_id, base_price, is_available, stock, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
      );
      insertOutletItem.run(burger, burgerItem, 45000, 1, 20);
      insertOutletItem.run(burger, friesItem, 18000, 1, 50);
      insertOutletItem.run(burger, saladItem, 24000, 1, 15);
    }

    db.prepare(
      "INSERT INTO couriers (user_id, is_active, rating_avg, rating_count) VALUES (?, ?, ?, ?)"
    ).run(jamshid, 1, 4.8, 21);

    const orderId = db.prepare(
      `INSERT INTO orders (order_number, client_user_id, outlet_id, courier_user_id, status, total_amount, delivery_address, created_at, accepted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      "ORD-1041",
      aziza,
      burger,
      jamshid,
      "accepted_by_restaurant",
      56000,
      "Main st, 21"
    ).lastInsertRowid;

    const insertOrderEvent = db.prepare(
      "INSERT INTO order_events (order_id, type, payload, actor_id) VALUES (?, ?, ?, ?)"
    );
    insertOrderEvent.run(
      orderId,
      "created",
      JSON.stringify({ status: "accepted_by_restaurant" }),
      admin
    );

    const insertPromo = db.prepare(
      "INSERT INTO promo_codes (code, description, discount_percent, max_uses, used_count, is_active) VALUES (?, ?, ?, ?, ?, ?)"
    );
    insertPromo.run("WELCOME10", "Welcome discount", 10, 100, 12, 1);
    insertPromo.run("COURIER5", "Courier bonus", 5, 50, 4, 1);

    const insertLedger = db.prepare(
      "INSERT INTO finance_ledger (title, amount, status, type, user_id, order_id, balance_delta, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    insertLedger.run(
      "Courier payout #208",
      120000,
      "pending",
      "courier_payout",
      jamshid,
      1,
      120000,
      "payout"
    );
    insertLedger.run(
      "Commission #41",
      86000,
      "completed",
      "commission",
      admin,
      null,
      86000,
      "commission"
    );
    insertLedger.run(
      "Courier bonus",
      15000,
      "completed",
      "bonus",
      jamshid,
      null,
      15000,
      "bonus"
    );
    insertLedger.run(
      "Order payment",
      56000,
      "completed",
      "payment",
      aziza,
      1,
      -56000,
      "payment"
    );

    const insertActivity = db.prepare(
      "INSERT INTO user_activity (user_id, event_type, details) VALUES (?, ?, ?)"
    );
    insertActivity.run(aziza, "login", "Mobile app login");
    insertActivity.run(jamshid, "status_change", "Courier set active");
    insertActivity.run(support, "order_note", "Added note to ORD-1041");

    const insertAudit = db.prepare(
      "INSERT INTO user_audit (user_id, actor, action, before_json, after_json) VALUES (?, ?, ?, ?, ?)"
    );
    insertAudit.run(
      aziza,
      "admin",
      "create",
      null,
      JSON.stringify({ status: "active", role: "client" })
    );
    insertAudit.run(
      jamshid,
      "admin",
      "update",
      JSON.stringify({ status: "blocked" }),
      JSON.stringify({ status: "active" })
    );

    seedClients(db);

    const insertNote = db.prepare(
      "INSERT INTO client_notes (client_user_id, author_user_id, text) VALUES (?, ?, ?)"
    );
    insertNote.run(aziza, support, "Client asked for a call 10 minutes before delivery.");

    const insertEntityNote = db.prepare(
      "INSERT INTO entity_notes (entity_type, entity_id, author_user_id, text) VALUES (?, ?, ?, ?)"
    );
    insertEntityNote.run(
      "courier",
      jamshid,
      support,
      "Courier request: call before arrival."
    );
  }

  ensureTestData(db);
  seedClients(db);
};

export const initDb = () => {
  const dbPath = resolveDbPath();
  ensureDir(dbPath);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  runMigrations(db);
  seedIfEmpty(db);
  return db;
};

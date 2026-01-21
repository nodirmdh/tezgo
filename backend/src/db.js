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
    "INSERT INTO partners (name, manager, status, contact_name, phone_primary, phone_secondary, phone_tertiary, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertOutlet = db.prepare(
    "INSERT INTO outlets (partner_id, type, name, address, is_active, status, hours, delivery_zone, phone, email, address_comment, status_reason, status_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  const partnerIds = db.prepare("SELECT id FROM partners").all().map((row) => row.id);
  const needPartners = Math.max(0, 3 - partnerIds.length);
  for (let i = 0; i < needPartners; i += 1) {
    const idx = partnerIds.length + i + 1;
    const partnerId = insertPartner
      .run(
        `Test Partner ${idx}`,
        `@partner_${idx}`,
        "active",
        `Manager ${idx}`,
        `+998 90 ${String(idx).padStart(3, "0")} 10 10`,
        `+998 90 ${String(idx).padStart(3, "0")} 20 20`,
        `+998 90 ${String(idx).padStart(3, "0")} 30 30`,
        `partner${idx}@example.com`
      )
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
      1,
      "open",
      "09:00-23:00",
      "3 km",
      `+998 90 ${String(idx).padStart(3, "0")} 55 55`,
      `restaurant${idx}@example.com`,
      "Side entrance",
      null,
      nowIso()
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
      1,
      "open",
      "09:00-22:00",
      "2 km",
      `+998 90 ${String(idx).padStart(3, "0")} 66 66`,
      `shop${idx}@example.com`,
      "Main entrance",
      null,
      nowIso()
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
  const itemCount = db.prepare("SELECT COUNT(*) as count FROM items").get();
  if (itemCount.count === 0 && outletIds.length) {
    const insertItem = db.prepare(
      `INSERT INTO items
        (title, sku, category, description, photo_url, weight_grams, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    );
    const insertOutletItem = db.prepare(
      `INSERT INTO outlet_items
        (outlet_id, item_id, base_price, is_available, stock, unavailable_reason, unavailable_until, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    );
    const burgerItem = insertItem.run(
      "Classic Burger",
      "BRG-001",
      "Burgers",
      "Beef patty, cheese, lettuce.",
      "https://picsum.photos/seed/burger/200/140",
      320
    ).lastInsertRowid;
    const friesItem = insertItem.run(
      "French Fries",
      "SID-101",
      "Sides",
      "Crispy salted fries.",
      "https://picsum.photos/seed/fries/200/140",
      150
    ).lastInsertRowid;
    const saladItem = insertItem.run(
      "Fresh Salad",
      "SAL-204",
      "Salads",
      "Greens with olive oil.",
      "https://picsum.photos/seed/salad/200/140",
      220
    ).lastInsertRowid;
    outletIds.forEach((outletId) => {
      insertOutletItem.run(outletId, burgerItem, 45000, 1, 20, null, null);
      insertOutletItem.run(outletId, friesItem, 18000, 1, 50, null, null);
      insertOutletItem.run(outletId, saladItem, 24000, 1, 15, null, null);
    });
  }
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
    const insertOrderItem = db.prepare(
      `INSERT INTO order_items
        (order_id, title, description, photo_url, sku, weight_grams, unit_price, quantity, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const updateOrderDetails = db.prepare(
      `UPDATE orders
       SET subtotal_food = ?,
           courier_fee = ?,
           service_fee = ?,
           restaurant_commission = ?,
           restaurant_penalty = ?,
           discount_amount = ?,
           promo_code = ?,
           total_amount = ?,
           delivery_address_comment = ?,
           address_entrance = ?,
           address_floor = ?,
           address_apartment = ?,
           comment_to_restaurant = ?,
           comment_to_address = ?,
           crm_comment = ?,
           receiver_name = ?,
           receiver_phone = ?,
           orderer_phone = ?,
           utensils_count = ?,
           is_for_other = ?,
           promised_delivery_at = ?,
           sent_to_restaurant_at = ?
       WHERE id = ?`
    );
    const outletItemsStmt = db.prepare(
      `SELECT items.title,
              items.sku,
              items.category,
              outlet_items.base_price
       FROM outlet_items
       JOIN items ON items.id = outlet_items.item_id
       WHERE outlet_items.outlet_id = ?
       ORDER BY items.id ASC`
    );
    const clientPhoneStmt = db.prepare("SELECT phone FROM clients WHERE user_id = ?");
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
      const availableItems = outletItemsStmt.all(outletId);
      const selectedItems = availableItems.length
        ? availableItems.slice(0, Math.min(3, availableItems.length))
        : [
            { title: "Sample Item", sku: "SKU-001", category: "General", base_price: 15000 }
          ];
      let subtotalFood = 0;
      selectedItems.forEach((item) => {
        const quantity = randomBetween(1, 3);
        const unitPrice = item.base_price || randomBetween(15000, 45000);
        const totalPrice = unitPrice * quantity;
        subtotalFood += totalPrice;
        insertOrderItem.run(
          orderId,
          item.title,
          `Category: ${item.category || "General"}`,
          null,
          item.sku,
          randomBetween(200, 700),
          unitPrice,
          quantity,
          totalPrice
        );
      });
      const deliveryFee = randomBetween(5000, 12000);
      const serviceFee = randomBetween(1500, 3500);
      const commission = Math.round(subtotalFood * 0.1);
      const penalty = i % 6 === 0 ? randomBetween(1000, 3000) : 0;
      const discount = i % 4 === 0 ? randomBetween(2000, 8000) : 0;
      const promoCode = discount ? "WELCOME10" : null;
      const totalAmount = Math.max(
        0,
        subtotalFood + deliveryFee + serviceFee - discount
      );
      const clientPhone = clientPhoneStmt.get(clientId)?.phone || null;
      const isForOther = i % 3 === 0 ? 1 : 0;
      const receiverName = isForOther ? `Receiver ${clientId}` : null;
      const receiverPhone = isForOther
        ? `+998 90 ${String(clientId).padStart(3, "0")} 11 11`
        : null;
      const promisedAt = addMinutes(createdAt, randomBetween(40, 90));
      const sentToRestaurantAt = addMinutes(createdAt, randomBetween(1, 4));
      updateOrderDetails.run(
        subtotalFood,
        deliveryFee,
        serviceFee,
        commission,
        penalty,
        discount,
        promoCode,
        totalAmount,
        "Near the main entrance",
        String(randomBetween(1, 6)),
        String(randomBetween(1, 9)),
        String(randomBetween(10, 50)),
        "No onions, please",
        "Call on arrival",
        "Handled by support",
        receiverName,
        receiverPhone,
        clientPhone,
        randomBetween(1, 4),
        isForOther,
        promisedAt,
        sentToRestaurantAt,
        orderId
      );
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
      "INSERT INTO partners (name, manager, status, contact_name, phone_primary, phone_secondary, phone_tertiary, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const kungrad = insertPartner
      .run(
        "Kungrad Foods",
        "@kungrad_admin",
        "active",
        "Akmal Kurbanov",
        "+998 90 111 22 33",
        "+998 90 111 22 44",
        "+998 90 111 22 55",
        "kungrad@example.com"
      )
      .lastInsertRowid;
    const fresh = insertPartner
      .run(
        "Fresh Market",
        "@fresh_ops",
        "active",
        "Dilnoza Karimova",
        "+998 90 222 33 44",
        "+998 90 222 33 55",
        "+998 90 222 33 66",
        "fresh@example.com"
      )
      .lastInsertRowid;

    const insertOutlet = db.prepare(
      "INSERT INTO outlets (partner_id, type, name, address, is_active, status, hours, delivery_zone, phone, email, address_comment, status_reason, status_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const burger = insertOutlet
      .run(
        kungrad,
        "restaurant",
        "Burger Way",
        "Main st, 12",
        1,
        "open",
        "09:00-23:00",
        "3 km",
        "+998 90 555 66 77",
        "burger@example.com",
        "Near main entrance",
        null,
        nowIso()
      )
      .lastInsertRowid;
    insertOutlet.run(
      fresh,
      "shop",
      "Green Market",
      "Central ave, 88",
      1,
      "open",
      "08:00-22:00",
      "5 km",
      "+998 90 333 44 55",
      "green@example.com",
      "Back door",
      null,
      nowIso()
    );

    const itemCount = db.prepare("SELECT COUNT(*) as count FROM items").get();
    if (itemCount.count === 0) {
      const insertItem = db.prepare(
        `INSERT INTO items
          (title, sku, category, description, photo_url, weight_grams, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      );
      const burgerItem = insertItem.run(
        "Classic Burger",
        "BRG-001",
        "Burgers",
        "Beef patty, cheese, lettuce.",
        "https://picsum.photos/seed/burger/200/140",
        320
      ).lastInsertRowid;
      const friesItem = insertItem.run(
        "French Fries",
        "SID-101",
        "Sides",
        "Crispy salted fries.",
        "https://picsum.photos/seed/fries/200/140",
        150
      ).lastInsertRowid;
      const saladItem = insertItem.run(
        "Fresh Salad",
        "SAL-204",
        "Salads",
        "Greens with olive oil.",
        "https://picsum.photos/seed/salad/200/140",
        220
      ).lastInsertRowid;

      const insertOutletItem = db.prepare(
        `INSERT INTO outlet_items
          (outlet_id, item_id, base_price, is_available, stock, unavailable_reason, unavailable_until, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      );
      insertOutletItem.run(burger, burgerItem, 45000, 1, 20, null, null);
      insertOutletItem.run(burger, friesItem, 18000, 1, 50, null, null);
      insertOutletItem.run(burger, saladItem, 24000, 1, 15, null, null);
    }

    db.prepare(
      `INSERT INTO couriers
        (user_id, is_active, rating_avg, rating_count, phone, full_name, address, delivery_methods)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      jamshid,
      1,
      4.8,
      21,
      "+998 90 777 55 44",
      "Jamshid Karimov",
      "Tashkent, Chilonzor 12",
      "walk,bike,car"
    );

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

    const insertOrderItem = db.prepare(
      `INSERT INTO order_items
        (order_id, title, description, photo_url, sku, weight_grams, unit_price, quantity, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const updateOrderDetails = db.prepare(
      `UPDATE orders
       SET subtotal_food = ?,
           courier_fee = ?,
           service_fee = ?,
           restaurant_commission = ?,
           restaurant_penalty = ?,
           discount_amount = ?,
           promo_code = ?,
           total_amount = ?,
           delivery_address_comment = ?,
           address_entrance = ?,
           address_floor = ?,
           address_apartment = ?,
           comment_to_restaurant = ?,
           comment_to_address = ?,
           crm_comment = ?,
           receiver_name = ?,
           receiver_phone = ?,
           orderer_phone = ?,
           utensils_count = ?,
           is_for_other = ?,
           promised_delivery_at = ?,
           sent_to_restaurant_at = ?
       WHERE id = ?`
    );
    insertOrderItem.run(
      orderId,
      "Classic Burger",
      "Category: Burgers",
      null,
      "BRG-001",
      450,
      45000,
      1,
      45000
    );
    insertOrderItem.run(
      orderId,
      "French Fries",
      "Category: Sides",
      null,
      "SID-101",
      200,
      18000,
      1,
      18000
    );
    updateOrderDetails.run(
      63000,
      7000,
      2000,
      6300,
      1000,
      5000,
      "WELCOME10",
      67000,
      "Leave at the door",
      "2",
      "3",
      "12",
      "Less salt",
      "Please call",
      "VIP client",
      "Receiver 1",
      "+998 90 111 11 11",
      "+998 90 000 00 00",
      2,
      1,
      nowIso(),
      nowIso(),
      orderId
    );

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
    const insertPartnerLedger = db.prepare(
      "INSERT INTO finance_ledger (title, amount, status, type, partner_id, order_id, balance_delta, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
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
    insertPartnerLedger.run(
      "Partner payout #1041",
      60000,
      "completed",
      "payment",
      kungrad,
      orderId,
      60000,
      "partner"
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

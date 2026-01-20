import crypto from "crypto";
import express from "express";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const users = [
  { id: 1, tg_id: "TG-1021", username: "@aziza", status: "active" },
  { id: 2, tg_id: "TG-874", username: "@jamshid", status: "blocked" }
];
const partners = [
  { id: 1, name: "Kungrad Foods" },
  { id: 2, name: "Fresh Market" }
];
const outlets = [
  { id: 1, partner_id: 1, type: "restaurant", name: "Burger Way" },
  { id: 2, partner_id: 2, type: "shop", name: "Green Market" }
];
const couriers = [
  { user_id: 3, is_active: true, rating_avg: 4.8, rating_count: 21 }
];
const orders = [
  {
    id: 1,
    order_number: "ORD-1041",
    outlet_id: 1,
    client_user_id: 1,
    courier_user_id: 3,
    status: "accepted_by_restaurant",
    pickup_attempts: 0,
    pickup_code_hash: null,
    pickup_locked_until: null
  }
];

const generatePickupCode = () =>
  String(Math.floor(100 + Math.random() * 900));

const hashCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const nowIso = () => new Date().toISOString();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/users", (_req, res) => {
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const newUser = {
    id: users.length + 1,
    tg_id: req.body.tg_id,
    username: req.body.username,
    status: req.body.status ?? "active"
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.get("/api/partners", (_req, res) => {
  res.json(partners);
});

app.post("/api/partners", (req, res) => {
  const newPartner = { id: partners.length + 1, name: req.body.name };
  partners.push(newPartner);
  res.status(201).json(newPartner);
});

app.get("/api/outlets", (_req, res) => {
  res.json(outlets);
});

app.post("/api/outlets", (req, res) => {
  const newOutlet = {
    id: outlets.length + 1,
    partner_id: req.body.partner_id,
    type: req.body.type,
    name: req.body.name
  };
  outlets.push(newOutlet);
  res.status(201).json(newOutlet);
});

app.get("/api/couriers", (_req, res) => {
  res.json(couriers);
});

app.post("/api/couriers", (req, res) => {
  const newCourier = {
    user_id: req.body.user_id,
    is_active: req.body.is_active ?? true,
    rating_avg: req.body.rating_avg ?? 0,
    rating_count: req.body.rating_count ?? 0
  };
  couriers.push(newCourier);
  res.status(201).json(newCourier);
});

app.get("/api/orders", (_req, res) => {
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const newOrder = {
    id: orders.length + 1,
    order_number: req.body.order_number,
    outlet_id: req.body.outlet_id,
    client_user_id: req.body.client_user_id,
    courier_user_id: req.body.courier_user_id ?? null,
    status: req.body.status ?? "accepted_by_system",
    pickup_attempts: 0,
    pickup_code_hash: null,
    pickup_locked_until: null
  };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

app.get("/api/orders/:id", (req, res) => {
  const order = orders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  return res.json(order);
});

app.patch("/api/orders/:id", (req, res) => {
  const order = orders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.status = req.body.status ?? order.status;
  order.courier_user_id = req.body.courier_user_id ?? order.courier_user_id;
  order.prep_eta_minutes = req.body.prep_eta_minutes ?? order.prep_eta_minutes;
  return res.json(order);
});

app.post("/api/orders/:id/accept", (req, res) => {
  const order = orders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const pickupCode = generatePickupCode();
  order.status = "accepted_by_restaurant";
  order.accepted_at = nowIso();
  order.prep_eta_minutes = req.body.prep_eta_minutes ?? null;
  order.pickup_code_hash = hashCode(pickupCode);
  order.pickup_attempts = 0;
  order.pickup_locked_until = null;

  return res.json({ order, pickup_code: pickupCode });
});

app.post("/api/orders/:id/ready", (req, res) => {
  const order = orders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.status = "ready_for_pickup";
  order.ready_at = nowIso();
  return res.json(order);
});

app.post("/api/orders/:id/pickup", (req, res) => {
  const order = orders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (order.pickup_locked_until && Date.now() < order.pickup_locked_until) {
    return res.status(429).json({ error: "Pickup locked" });
  }

  const code = String(req.body.code ?? "");
  if (hashCode(code) !== order.pickup_code_hash) {
    order.pickup_attempts += 1;
    if (order.pickup_attempts >= 3) {
      order.pickup_locked_until = Date.now() + 10 * 60 * 1000;
    }
    return res.status(400).json({ error: "Invalid pickup code" });
  }

  order.status = "picked_up";
  order.picked_up_at = nowIso();
  order.pickup_attempts = 0;
  order.pickup_locked_until = null;
  return res.json(order);
});

app.post("/api/orders/:id/deliver", (req, res) => {
  const order = orders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.status = "delivered";
  order.delivered_at = nowIso();
  return res.json(order);
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

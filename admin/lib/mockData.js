export const users = [
  { id: 1, tg_id: "TG-1021", username: "@aziza", status: "active", role: "client" },
  { id: 2, tg_id: "TG-874", username: "@jamshid", status: "blocked", role: "courier" },
  { id: 3, tg_id: "TG-322", username: "@admin", status: "active", role: "admin" }
];

export const clients = [
  { id: 1, name: "Азиза Н.", phone: "+998 90 123 45 67", status: "active" },
  { id: 2, name: "Отабек С.", phone: "+998 93 456 78 12", status: "active" },
  { id: 3, name: "Мария К.", phone: "+998 97 222 11 00", status: "blocked" }
];

export const partners = [
  { id: 1, name: "Kungrad Foods", outlets: 3, manager: "@kungrad_admin" },
  { id: 2, name: "Fresh Market", outlets: 2, manager: "@fresh_ops" }
];

export const outlets = [
  { id: 1, name: "Burger Way", type: "restaurant", address: "ул. Навои, 12" },
  { id: 2, name: "Green Market", type: "shop", address: "пр. Мустакиллик, 88" }
];

export const couriers = [
  { user_id: 2, name: "Шавкат А.", rating: 4.8, status: "active" },
  { user_id: 5, name: "Нодира К.", rating: 4.6, status: "active" },
  { user_id: 7, name: "Ильяс Т.", rating: 4.1, status: "paused" }
];

export const orders = [
  {
    id: "ORD-1041",
    db_id: 1,
    order_number: "ORD-1041",
    outlet: "Burger Way",
    courier: "Шавкат А.",
    status: "accepted_by_restaurant",
    status_raw: "accepted_by_restaurant",
    pickup_code_plain: "815"
  },
  {
    id: "ORD-1040",
    db_id: 2,
    order_number: "ORD-1040",
    outlet: "Green Market",
    courier: "-",
    status: "ready_for_pickup",
    status_raw: "ready_for_pickup",
    pickup_code_plain: null
  },
  {
    id: "ORD-1039",
    db_id: 3,
    order_number: "ORD-1039",
    outlet: "Sushi Lab",
    courier: "Нодира К.",
    status: "picked_up",
    status_raw: "picked_up",
    pickup_code_plain: null
  }
];

export const financeSummary = [
  { type: "commission", amount: 7 },
  { type: "service_fee", amount: 5000 },
  { type: "delivery_share", amount: 20 }
];

export const financeTransactions = [
  { id: 1, title: "Выплата курьеру #208", amount: 120000, status: "pending" },
  { id: 2, title: "Комиссия партнёра #41", amount: 86000, status: "completed" }
];

export const dashboardCards = [
  { titleKey: "dashboard.cards.ordersToday", value: "124" },
  { titleKey: "dashboard.cards.activeCouriers", value: "18" },
  { titleKey: "dashboard.cards.newClients", value: "32" },
  { titleKey: "dashboard.cards.serviceFee", value: "1 200 000" }
];

export const recentOrders = [
  { id: "ORD-1041", outlet: "Burger Way", status: "accepted_by_restaurant" },
  { id: "ORD-1040", outlet: "Green Market", status: "ready_for_pickup" },
  { id: "ORD-1039", outlet: "Sushi Lab", status: "picked_up" }
];

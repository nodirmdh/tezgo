export const users = [
  { id: "TG-1021", username: "@aziza", status: "active", role: "Client" },
  { id: "TG-874", username: "@jamshid", status: "blocked", role: "Courier" },
  { id: "TG-322", username: "@admin", status: "active", role: "Admin" }
];

export const clients = [
  { name: "Азиза Н.", phone: "+998 90 123 45 67", orders: 12 },
  { name: "Отабек С.", phone: "+998 93 456 78 12", orders: 4 },
  { name: "Мария К.", phone: "+998 97 222 11 00", orders: 9 }
];

export const partners = [
  { name: "Kungrad Foods", outlets: 3, manager: "@kungrad_admin" },
  { name: "Fresh Market", outlets: 2, manager: "@fresh_ops" }
];

export const outlets = [
  { name: "Burger Way", type: "restaurant", address: "ул. Навои, 12" },
  { name: "Green Market", type: "shop", address: "пр. Мустакиллик, 88" }
];

export const couriers = [
  { name: "Шавкат А.", rating: 4.8, status: "active" },
  { name: "Нодира К.", rating: 4.6, status: "active" },
  { name: "Ильяс Т.", rating: 4.1, status: "paused" }
];

export const orders = [
  {
    id: "ORD-1041",
    outlet: "Burger Way",
    courier: "Шавкат А.",
    status: "Принят рестораном"
  },
  {
    id: "ORD-1040",
    outlet: "Green Market",
    courier: "—",
    status: "Готов к выдаче"
  },
  {
    id: "ORD-1039",
    outlet: "Sushi Lab",
    courier: "Нодира К.",
    status: "Курьер забрал"
  }
];

export const financeSummary = [
  { type: "Комиссия", amount: "7% от subtotal" },
  { type: "Сервисный сбор", amount: "5 000 сум" },
  { type: "Доля доставки", amount: "20% от courier_fee" }
];

export const financeTransactions = [
  { title: "Выплата курьеру #208", amount: "120 000 сум", status: "В обработке" },
  { title: "Комиссия партнёра #41", amount: "86 000 сум", status: "Завершено" }
];

export const dashboardCards = [
  { title: "Заказы сегодня", value: "124" },
  { title: "Активные курьеры", value: "18" },
  { title: "Новые клиенты", value: "32" },
  { title: "Сервисный сбор", value: "1 200 000 сум" }
];

export const recentOrders = [
  { id: "ORD-1041", outlet: "Burger Way", status: "Принят рестораном" },
  { id: "ORD-1040", outlet: "Green Market", status: "Готов к выдаче" },
  { id: "ORD-1039", outlet: "Sushi Lab", status: "Курьер забрал" }
];

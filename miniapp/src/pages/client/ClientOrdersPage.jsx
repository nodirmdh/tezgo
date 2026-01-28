import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "../../auth/api";

const statusLabels = {
  created: "Новый",
  pending_partner: "Ожидает подтверждения",
  accepted: "Принят",
  preparing: "Готовится",
  accepted_by_restaurant: "Принят",
  ready: "Готов",
  ready_for_pickup: "Готов",
  handed_over: "Выдан",
  picked_up: "Передан курьеру",
  delivered: "Доставлен",
  closed: "Закрыт",
  rejected: "Отклонён",
  cancelled: "Отменён"
};

const statusTabs = [
  { id: "active", label: "Активные", statuses: ["pending_partner", "accepted", "preparing", "ready", "ready_for_pickup"] },
  { id: "history", label: "История", statuses: ["handed_over", "delivered", "closed", "rejected", "cancelled"] }
];

export default function ClientOrdersPage() {
  const [tab, setTab] = useState("active");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = async (tabId = tab) => {
    setLoading(true);
    const selected = statusTabs.find((item) => item.id === tabId);
    const params = new URLSearchParams({});
    if (selected?.statuses?.length) {
      params.set("status", selected.statuses.join(","));
    }
    const result = await apiJson(`/client/orders?${params.toString()}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setOrders(result.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [tab]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Мои заказы</p>
          <h2>История</h2>
        </div>
      </div>
      <div className="panel">
        <div className="tabs">
          {statusTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "tab active" : "tab"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {error ? <div className="auth-error">{error}</div> : null}
        {loading ? (
          <div className="muted">Загрузка...</div>
        ) : (
          <div className="list-grid">
            {orders.map((order) => (
              <Link key={order.id} to={`/client/orders/${order.id}`} className="card">
                <div className="card-title">{order.order_number}</div>
                <div className="muted">
                  {statusLabels[order.status] || order.status} ·{" "}
                  {new Date(order.created_at).toLocaleString("ru-RU")}
                </div>
                <div className="muted">
                  Сумма: {order.food_total} сум · Сервис: {order.service_fee} сум
                </div>
              </Link>
            ))}
            {!orders.length ? <div className="muted">Заказов нет.</div> : null}
          </div>
        )}
      </div>
    </section>
  );
}

import { useAuth } from "../auth/AuthContext";

const availableOrders = [
  { number: "ORD-1051", pickup: "Burger Way", distance: "2.1 км" },
  { number: "ORD-1052", pickup: "Green Market", distance: "3.4 км" }
];

const routeStops = [
  { label: "Забрать", value: "ул. Навои, 12" },
  { label: "Доставить", value: "пр. Мустакиллик, 88" }
];

export default function CourierPage() {
  const { user, logout } = useAuth();
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Courier mini app</p>
          <h2>Доступные заказы и маршрут</h2>
        </div>
        <div className="status-chip success">User: {user?.username || user?.id}</div>
      </div>
      <div className="action-row">
        <button className="ghost" type="button" onClick={logout}>
          Log out
        </button>
      </div>
      <div className="grid two">
        <div className="panel">
          <h3>Доступные заказы</h3>
          <div className="queue">
            {availableOrders.map((order) => (
              <div key={order.number} className="queue-card">
                <div>
                  <div className="queue-number">{order.number}</div>
                  <div className="muted">{order.pickup}</div>
                </div>
                <div className="queue-actions">
                  <span className="pill">{order.distance}</span>
                  <button className="primary">Взять</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Текущий маршрут</h3>
          <div className="route-card">
            <div className="route-code">
              <div className="muted">Pickup-код</div>
              <div className="code-value">815</div>
            </div>
            <div className="route-stops">
              {routeStops.map((stop) => (
                <div key={stop.label} className="route-row">
                  <span className="muted">{stop.label}</span>
                  <span>{stop.value}</span>
                </div>
              ))}
            </div>
            <div className="action-row">
              <button className="primary">Забрал</button>
              <button className="ghost">Доставил</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

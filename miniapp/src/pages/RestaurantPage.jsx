const orders = [
  { number: "ORD-1045", items: "2x Classic Burger", eta: "18 мин" },
  { number: "ORD-1046", items: "Салат + лимонад", eta: "12 мин" },
  { number: "ORD-1047", items: "Фреш + ролл", eta: "20 мин" }
];

const menu = [
  { name: "Classic Burger", price: "38 000 сум", status: "available" },
  { name: "Chicken Wrap", price: "32 000 сум", status: "stop-list" },
  { name: "Lemonade 0.5", price: "9 000 сум", status: "available" }
];

export default function RestaurantPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Restaurant mini app</p>
          <h2>Очередь заказов и меню</h2>
        </div>
        <div className="status-chip warning">Пик: 14:00–16:00</div>
      </div>
      <div className="grid two">
        <div className="panel">
          <h3>В работе сейчас</h3>
          <div className="queue">
            {orders.map((order) => (
              <div key={order.number} className="queue-card">
                <div>
                  <div className="queue-number">{order.number}</div>
                  <div className="muted">{order.items}</div>
                </div>
                <div className="queue-actions">
                  <span className="pill">{order.eta}</span>
                  <button className="ghost">Готово</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Меню и стоп-лист</h3>
          {menu.map((item) => (
            <div key={item.name} className="menu-row">
              <div>
                <div className="menu-name">{item.name}</div>
                <div className="muted">{item.price}</div>
              </div>
              <span
                className={
                  item.status === "available"
                    ? "pill success"
                    : "pill danger"
                }
              >
                {item.status === "available" ? "В наличии" : "Стоп-лист"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

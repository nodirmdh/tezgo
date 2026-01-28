import { useAuth } from "../auth/AuthContext";

const catalog = [
  {
    title: "Burger Way",
    items: [
      { name: "Classic Burger", price: "38 000 сум" },
      { name: "Cheese Fries", price: "18 000 сум" },
      { name: "Lemonade 0.5", price: "9 000 сум" }
    ]
  },
  {
    title: "Green Market",
    items: [
      { name: "Авокадо", price: "22 000 сум" },
      { name: "Фреш апельсиновый", price: "16 000 сум" },
      { name: "Салат микс", price: "12 000 сум" }
    ]
  }
];

const activeOrder = {
  number: "ORD-1041",
  status: "Курьер забрал",
  eta: "12 мин",
  courier: "Шавкат А."
};

export default function ClientPage() {
  const { user, logout } = useAuth();
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Client mini app</p>
          <h2>Каталог и активный заказ</h2>
        </div>
        <div className="status-chip">User: {user?.phone || user?.username || user?.id}</div>
      </div>
      <div className="action-row">
        <button className="ghost" type="button" onClick={logout}>
          Log out
        </button>
      </div>
      <div className="grid two">
        <div className="panel">
          <h3>Каталог</h3>
          {catalog.map((section) => (
            <div key={section.title} className="catalog-block">
              <div className="catalog-title">{section.title}</div>
              {section.items.map((item) => (
                <div key={item.name} className="catalog-item">
                  <span>{item.name}</span>
                  <span className="muted">{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Активный заказ</h3>
          <div className="order-summary">
            <div>
              <div className="muted">Номер</div>
              <div className="summary-value">{activeOrder.number}</div>
            </div>
            <div>
              <div className="muted">Статус</div>
              <div className="summary-value">{activeOrder.status}</div>
            </div>
            <div>
              <div className="muted">ETA</div>
              <div className="summary-value">{activeOrder.eta}</div>
            </div>
            <div>
              <div className="muted">Курьер</div>
              <div className="summary-value">{activeOrder.courier}</div>
            </div>
          </div>
          <div className="action-row">
            <button className="primary">Отследить курьера</button>
            <button className="ghost">Связаться с поддержкой</button>
          </div>
        </div>
      </div>
    </section>
  );
}

const highlights = [
  {
    title: "Client",
    description: "Каталог, корзина и трекинг активного заказа.",
    accent: "Каталог → Заказ"
  },
  {
    title: "Restaurant",
    description: "Очередь заказов, ETA и статусы приготовления.",
    accent: "Принял → Готов"
  },
  {
    title: "Courier",
    description: "Доступные заказы, pickup-код и доставка.",
    accent: "Забрал → Доставил"
  }
];

const stats = [
  { label: "Среднее ETA", value: "18 мин" },
  { label: "Активные курьеры", value: "24" },
  { label: "SLA сегодня", value: "96%" }
];

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Kungrad Delivery Platform</p>
        <h1>
          Три роли, один поток.
          <span> Клиент, ресторан, курьер.</span>
        </h1>
        <p className="subtitle">
          Единая витрина для управления жизненным циклом заказа в формате
          Telegram Mini App.
        </p>
        <div className="stat-row">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="cards">
        {highlights.map((item) => (
          <article key={item.title} className="highlight-card">
            <div className="card-tag">{item.accent}</div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="card-footer">Открыть сценарий</div>
          </article>
        ))}
      </div>
    </section>
  );
}

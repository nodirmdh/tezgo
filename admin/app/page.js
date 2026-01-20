import PageHeader from "./components/PageHeader";

const cards = [
  { title: "Заказы сегодня", value: "124" },
  { title: "Активные курьеры", value: "18" },
  { title: "Новые клиенты", value: "32" },
  { title: "Сервисный сбор", value: "1 200 000 сум" }
];

const recentOrders = [
  { id: "ORD-1041", outlet: "Burger Way", status: "Принят рестораном" },
  { id: "ORD-1040", outlet: "Green Market", status: "Готов к выдаче" },
  { id: "ORD-1039", outlet: "Sushi Lab", status: "Курьер забрал" }
];

export default function HomePage() {
  return (
    <main>
      <PageHeader
        title="Дашборд"
        description="Ключевые показатели и последние события платформы."
      />

      <section className="cards">
        {cards.map((card) => (
          <div key={card.title} className="card">
            <div style={{ color: "#64748B", fontSize: "13px" }}>
              {card.title}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
              {card.value}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 style={{ marginBottom: "12px" }}>Последние заказы</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Заведение</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.outlet}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

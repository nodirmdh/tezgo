import PageHeader from "../components/PageHeader";

const orders = [
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

export default function OrdersPage() {
  return (
    <main>
      <PageHeader
        title="Orders"
        description="Текущие заказы и ответственные курьеры."
      />
      <table className="table">
        <thead>
          <tr>
            <th>Номер</th>
            <th>Заведение</th>
            <th>Курьер</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.outlet}</td>
              <td>{order.courier}</td>
              <td>
                <span className="badge">{order.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

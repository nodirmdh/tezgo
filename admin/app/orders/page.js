import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";

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
      <Toolbar title="Фильтры заказов" actionLabel="Создать заказ">
        <input className="input" placeholder="Поиск по номеру заказа" />
        <select className="select">
          <option>Все статусы</option>
          <option>Принят системой</option>
          <option>Принят рестораном</option>
          <option>Готов к выдаче</option>
          <option>Курьер забрал</option>
          <option>Доставил</option>
        </select>
      </Toolbar>
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

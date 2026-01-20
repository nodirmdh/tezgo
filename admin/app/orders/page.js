import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import { getOrders } from "../../lib/mockApi";

export default async function OrdersPage() {
  const orders = await getOrders();
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

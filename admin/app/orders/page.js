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
      <div className="form-grid">
        <div className="card-title">Карточка заказа</div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="orderNumber">Номер заказа</label>
            <input id="orderNumber" className="input" placeholder="ORD-1041" />
          </div>
          <div className="auth-field">
            <label htmlFor="orderStatus">Статус</label>
            <select id="orderStatus" className="select">
              <option>Принят системой</option>
              <option>Принят рестораном</option>
              <option>Готов к выдаче</option>
              <option>Курьер забрал</option>
              <option>Доставил</option>
            </select>
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="orderOutlet">Заведение</label>
            <input id="orderOutlet" className="input" placeholder="Burger Way" />
          </div>
          <div className="auth-field">
            <label htmlFor="orderCourier">Курьер</label>
            <input id="orderCourier" className="input" placeholder="Шавкат А." />
          </div>
        </div>
        <div className="form-row">
          <div className="auth-field">
            <label htmlFor="orderNote">Комментарий</label>
            <input id="orderNote" className="input" placeholder="Без лука" />
          </div>
        </div>
        <button className="button" type="button">
          Сохранить изменения
        </button>
      </div>
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

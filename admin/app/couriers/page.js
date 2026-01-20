import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import { getCouriers } from "../../lib/mockApi";

export default async function CouriersPage() {
  const couriers = await getCouriers();
  return (
    <main>
      <PageHeader title="Couriers" description="Курьеры и текущий статус работы." />
      <div className="form-grid">
        <div className="card-title">Добавить курьера</div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="courierName">Имя курьера</label>
            <input
              id="courierName"
              className="input"
              placeholder="Шавкат А."
            />
          </div>
          <div className="auth-field">
            <label htmlFor="courierTg">Telegram ID</label>
            <input id="courierTg" className="input" placeholder="123456789" />
          </div>
        </div>
        <button className="button" type="button">
          Создать курьера
        </button>
      </div>
      <Toolbar title="Фильтры курьеров">
        <input className="input" placeholder="Поиск по имени курьера" />
        <select className="select">
          <option>Все статусы</option>
          <option>active</option>
          <option>paused</option>
          <option>blocked</option>
        </select>
      </Toolbar>
      <table className="table">
        <thead>
          <tr>
            <th>Курьер</th>
            <th>Рейтинг</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {couriers.map((courier) => (
            <tr key={courier.name}>
              <td>{courier.name}</td>
              <td>{courier.rating}</td>
              <td>
                <span className="badge">{courier.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import { getOutlets } from "../../lib/mockApi";

export default async function OutletsPage() {
  const outlets = await getOutlets();
  return (
    <main>
      <PageHeader
        title="Outlets"
        description="Список активных ресторанов и магазинов."
      />
      <div className="form-grid">
        <div className="card-title">Создать филиал</div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="outletName">Название заведения</label>
            <input
              id="outletName"
              className="input"
              placeholder="Burger Way"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="outletType">Тип</label>
            <select id="outletType" className="select">
              <option>restaurant</option>
              <option>shop</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="auth-field">
            <label htmlFor="outletAddress">Адрес</label>
            <input
              id="outletAddress"
              className="input"
              placeholder="ул. Навои, 12"
            />
          </div>
        </div>
        <button className="button" type="button">
          Добавить филиал
        </button>
      </div>
      <Toolbar title="Фильтры заведений">
        <input className="input" placeholder="Поиск по названию или адресу" />
        <select className="select">
          <option>Все типы</option>
          <option>restaurant</option>
          <option>shop</option>
        </select>
      </Toolbar>
      <table className="table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Тип</th>
            <th>Адрес</th>
          </tr>
        </thead>
        <tbody>
          {outlets.map((outlet) => (
            <tr key={outlet.name}>
              <td>{outlet.name}</td>
              <td>{outlet.type}</td>
              <td>{outlet.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";

const couriers = [
  { name: "Шавкат А.", rating: 4.8, status: "active" },
  { name: "Нодира К.", rating: 4.6, status: "active" },
  { name: "Ильяс Т.", rating: 4.1, status: "paused" }
];

export default function CouriersPage() {
  return (
    <main>
      <PageHeader title="Couriers" description="Курьеры и текущий статус работы." />
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

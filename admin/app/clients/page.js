import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import { getClients } from "../../lib/mockApi";

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <main>
      <PageHeader title="Clients" description="База клиентов и количество заказов." />
      <Toolbar title="Фильтры клиентов">
        <input className="input" placeholder="Поиск по имени или телефону" />
        <select className="select">
          <option>Все статусы</option>
          <option>Активные</option>
          <option>Заблокированные</option>
        </select>
      </Toolbar>
      <table className="table">
        <thead>
          <tr>
            <th>Клиент</th>
            <th>Телефон</th>
            <th>Заказов</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.phone}>
              <td>{client.name}</td>
              <td>{client.phone}</td>
              <td>{client.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

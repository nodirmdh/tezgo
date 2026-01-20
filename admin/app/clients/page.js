import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";

const clients = [
  { name: "Азиза Н.", phone: "+998 90 123 45 67", orders: 12 },
  { name: "Отабек С.", phone: "+998 93 456 78 12", orders: 4 },
  { name: "Мария К.", phone: "+998 97 222 11 00", orders: 9 }
];

export default function ClientsPage() {
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

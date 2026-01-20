import PageHeader from "../components/PageHeader";

const clients = [
  { name: "Азиза Н.", phone: "+998 90 123 45 67", orders: 12 },
  { name: "Отабек С.", phone: "+998 93 456 78 12", orders: 4 },
  { name: "Мария К.", phone: "+998 97 222 11 00", orders: 9 }
];

export default function ClientsPage() {
  return (
    <main>
      <PageHeader title="Clients" description="База клиентов и количество заказов." />
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

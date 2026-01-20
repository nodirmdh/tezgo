const couriers = [
  { name: "Шавкат А.", rating: 4.8, status: "active" },
  { name: "Нодира К.", rating: 4.6, status: "active" },
  { name: "Ильяс Т.", rating: 4.1, status: "paused" }
];

export default function CouriersPage() {
  return (
    <main>
      <header className="page-header">
        <h1>Couriers</h1>
        <p>Курьеры и текущий статус работы.</p>
      </header>
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

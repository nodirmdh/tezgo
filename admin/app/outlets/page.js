const outlets = [
  { name: "Burger Way", type: "restaurant", address: "ул. Навои, 12" },
  { name: "Green Market", type: "shop", address: "пр. Мустакиллик, 88" }
];

export default function OutletsPage() {
  return (
    <main>
      <header className="page-header">
        <h1>Outlets</h1>
        <p>Список активных ресторанов и магазинов.</p>
      </header>
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

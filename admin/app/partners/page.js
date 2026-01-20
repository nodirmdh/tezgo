const partners = [
  { name: "Kungrad Foods", outlets: 3, manager: "@kungrad_admin" },
  { name: "Fresh Market", outlets: 2, manager: "@fresh_ops" }
];

export default function PartnersPage() {
  return (
    <main>
      <header className="page-header">
        <h1>Partners</h1>
        <p>Партнёры и привязанные филиалы.</p>
      </header>
      <table className="table">
        <thead>
          <tr>
            <th>Партнёр</th>
            <th>Филиалов</th>
            <th>Менеджер</th>
          </tr>
        </thead>
        <tbody>
          {partners.map((partner) => (
            <tr key={partner.name}>
              <td>{partner.name}</td>
              <td>{partner.outlets}</td>
              <td>{partner.manager}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

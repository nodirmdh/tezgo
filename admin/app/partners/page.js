import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import { getPartners } from "../../lib/mockApi";

export default async function PartnersPage() {
  const partners = await getPartners();
  return (
    <main>
      <PageHeader
        title="Partners"
        description="Партнёры и привязанные филиалы."
      />
      <Toolbar title="Фильтры партнёров">
        <input className="input" placeholder="Поиск по названию партнёра" />
      </Toolbar>
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

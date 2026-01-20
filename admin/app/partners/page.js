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
      <div className="form-grid">
        <div className="card-title">Создать партнёра</div>
        <div className="form-row two">
          <div className="auth-field">
            <label htmlFor="partnerName">Название партнёра</label>
            <input
              id="partnerName"
              className="input"
              placeholder="Kungrad Foods"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="partnerManager">Менеджер (username)</label>
            <input
              id="partnerManager"
              className="input"
              placeholder="@partner_manager"
            />
          </div>
        </div>
        <button className="button" type="button">
          Добавить партнёра
        </button>
        <div className="helper-text">
          Используется для онбординга партнёров через админку.
        </div>
      </div>
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

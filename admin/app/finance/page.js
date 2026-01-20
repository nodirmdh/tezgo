import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import { getFinance } from "../../lib/mockApi";

export default async function FinancePage() {
  const { summary, transactions } = await getFinance();
  return (
    <main>
      <PageHeader title="Finance" description="Сводка начислений и удержаний." />
      <Toolbar title="Фильтры выплат" actionLabel="Экспорт">
        <input className="input" placeholder="Поиск по транзакции" />
        <select className="select">
          <option>Все статусы</option>
          <option>В обработке</option>
          <option>Завершено</option>
        </select>
      </Toolbar>
      <div className="cards">
        {summary.map((item) => (
          <div key={item.type} className="card">
            <div style={{ color: "#64748B", fontSize: "13px" }}>{item.type}</div>
            <div style={{ fontSize: "18px", fontWeight: 600, marginTop: "6px" }}>
              {item.amount}
            </div>
          </div>
        ))}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Транзакция</th>
            <th>Сумма</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => (
            <tr key={item.title}>
              <td>{item.title}</td>
              <td>{item.amount}</td>
              <td>
                <span className="badge">{item.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

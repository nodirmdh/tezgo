import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";

const payouts = [
  { type: "Комиссия", amount: "7% от subtotal" },
  { type: "Сервисный сбор", amount: "5 000 сум" },
  { type: "Доля доставки", amount: "20% от courier_fee" }
];

export default function FinancePage() {
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
        {payouts.map((item) => (
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
          <tr>
            <td>Выплата курьеру #208</td>
            <td>120 000 сум</td>
            <td>
              <span className="badge">В обработке</span>
            </td>
          </tr>
          <tr>
            <td>Комиссия партнёра #41</td>
            <td>86 000 сум</td>
            <td>
              <span className="badge">Завершено</span>
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}

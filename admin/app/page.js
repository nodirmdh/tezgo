import PageHeader from "./components/PageHeader";
import { getDashboardSummary } from "../lib/dataApi";
import { getServerLocale } from "../lib/i18n.server";
import { t, translateStatus } from "../lib/i18n";

export default async function HomePage() {
  const locale = getServerLocale();
  const { cards, recentOrders } = await getDashboardSummary();

  return (
    <main>
      <PageHeader titleKey="dashboard.title" descriptionKey="dashboard.description" />

      <section className="cards">
        {cards.map((card) => (
          <div key={card.titleKey || card.title} className="card">
            <div style={{ color: "#64748B", fontSize: "13px" }}>
              {card.titleKey ? t(locale, card.titleKey) : card.title}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
              {card.value}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 style={{ marginBottom: "12px" }}>{t(locale, "dashboard.recentOrders")}</h2>
        <table className="table">
          <thead>
            <tr>
              <th>{t(locale, "dashboard.table.orderId")}</th>
              <th>{t(locale, "dashboard.table.outlet")}</th>
              <th>{t(locale, "dashboard.table.status")}</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.outlet}</td>
                <td>
                  <span className="badge">
                    {order.status ? translateStatus(locale, order.status) : "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

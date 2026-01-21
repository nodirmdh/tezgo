import PageHeader from "./components/PageHeader";
import { getDashboardSummary } from "../lib/dataApi";

export default async function HomePage() {
  const { cards, recentOrders } = await getDashboardSummary();
  return (
    <main>
      <PageHeader
        title="Р”Р°С€Р±РѕСЂРґ"
        description="РљР»СЋС‡РµРІС‹Рµ РїРѕРєР°Р·Р°С‚РµР»Рё Рё РїРѕСЃР»РµРґРЅРёРµ СЃРѕР±С‹С‚РёСЏ РїР»Р°С‚С„РѕСЂРјС‹."
      />

      <section className="cards">
        {cards.map((card) => (
          <div key={card.title} className="card">
            <div style={{ color: "#64748B", fontSize: "13px" }}>
              {card.title}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "6px" }}>
              {card.value}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 style={{ marginBottom: "12px" }}>РџРѕСЃР»РµРґРЅРёРµ Р·Р°РєР°Р·С‹</h2>
        <table className="table">
          <thead>
            <tr>
              <th>РќРѕРјРµСЂ</th>
              <th>Р—Р°РІРµРґРµРЅРёРµ</th>
              <th>РЎС‚Р°С‚СѓСЃ</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.outlet}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

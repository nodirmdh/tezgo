const sections = [
  "Users",
  "Clients",
  "Partners",
  "Outlets",
  "Couriers",
  "Orders",
  "Finance"
];

export default function HomePage() {
  return (
    <main style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "8px" }}>Kungrad Admin</h1>
      <p style={{ marginTop: 0, color: "#4B5563" }}>
        Черновой каркас админки для раннего тестирования.
      </p>
      <div style={{ display: "grid", gap: "12px", marginTop: "24px" }}>
        {sections.map((section) => (
          <div
            key={section}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "16px"
            }}
          >
            <strong>{section}</strong>
            <div style={{ fontSize: "14px", color: "#6B7280" }}>
              Раздел в разработке
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

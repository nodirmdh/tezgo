"use client";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "menu", label: "Menu / Products" },
  { id: "campaigns", label: "Campaigns" },
  { id: "orders", label: "Orders" },
  { id: "notes", label: "Notes" }
];

export default function OutletTabs({ active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
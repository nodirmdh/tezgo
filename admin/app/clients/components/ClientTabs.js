"use client";

import { useLocale } from "../../components/LocaleProvider";

const tabs = [
  { id: "overview", labelKey: "tabs.overview" },
  { id: "orders", labelKey: "tabs.orders" },
  { id: "addresses", labelKey: "tabs.addresses" },
  { id: "promos", labelKey: "tabs.promos" },
  { id: "notes", labelKey: "tabs.notes" }
];

export default function ClientTabs({ active, onChange }) {
  const { t } = useLocale();
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}

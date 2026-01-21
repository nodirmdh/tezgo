"use client";

import { useLocale } from "../../components/LocaleProvider";

const tabs = [
  { id: "overview", labelKey: "tabs.overview" },
  { id: "orders", labelKey: "tabs.orders" },
  { id: "finance", labelKey: "tabs.finance" },
  { id: "activity", labelKey: "tabs.activity" },
  { id: "audit", labelKey: "tabs.audit" }
];

export default function UserTabs({ active, onChange }) {
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

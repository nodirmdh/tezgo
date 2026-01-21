"use client";

import { useLocale } from "../../components/LocaleProvider";

const tabs = [
  { id: "overview", labelKey: "tabs.overview" },
  { id: "outlets", labelKey: "tabs.outlets" },
  { id: "finance", labelKey: "tabs.finance" },
  { id: "notes", labelKey: "tabs.notes" }
];

export default function PartnerTabs({ active, onChange }) {
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

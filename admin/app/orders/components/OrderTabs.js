"use client";

import { useLocale } from "../../components/LocaleProvider";

const tabs = [
  { id: "overview", labelKey: "tabs.overview" },
  { id: "timeline", labelKey: "tabs.timeline" },
  { id: "flags", labelKey: "tabs.flags" },
  { id: "audit", labelKey: "tabs.audit" }
];

export default function OrderTabs({ active, onChange }) {
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

"use client";

import { localeLabels, locales } from "../../lib/i18n";
import { useLocale } from "./LocaleProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <label className="language-switcher">
      <span className="language-label">{t("app.language")}</span>
      <select
        className="select"
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {localeLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultLocale, resolveLocale, t as translate } from "../../lib/i18n";

const LocaleContext = createContext({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key, params) => translate(defaultLocale, key, params)
});

const normalizeLocale = (value) => {
  if (!value) {
    return defaultLocale;
  }
  const normalized = value.toLowerCase();
  if (normalized.startsWith("ru")) return "ru";
  if (normalized.startsWith("uz")) return "uz";
  if (normalized.startsWith("kaa")) return "kaa";
  if (normalized.startsWith("en")) return "en";
  return resolveLocale(normalized);
};

export function LocaleProvider({ children }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem("admin_locale");
    const preferred = normalizeLocale(stored || navigator.language);
    setLocaleState(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("admin_locale", locale);
    document.cookie = `admin_locale=${encodeURIComponent(locale)}; path=/; max-age=31536000`;
  }, [locale]);

  const setLocale = (next) => {
    setLocaleState(resolveLocale(next));
    router.refresh();
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params)
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);

import { cookies } from "next/headers";
import { resolveLocale } from "./i18n";

export const getServerLocale = () => {
  const store = cookies();
  const value = store.get("admin_locale")?.value;
  return resolveLocale(value);
};

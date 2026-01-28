"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useLocale } from "./LocaleProvider";
import { useAuth } from "./AuthProvider";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/users", labelKey: "nav.users", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/users/partners", labelKey: "nav.partnerUsers", roles: ["admin", "support"] },
  { href: "/users/couriers", labelKey: "nav.courierUsers", roles: ["admin", "support"] },
  { href: "/clients", labelKey: "nav.clients", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/partners", labelKey: "nav.partners", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/points", labelKey: "nav.points", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/outlets", labelKey: "nav.outlets", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/couriers", labelKey: "nav.couriers", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/orders", labelKey: "nav.orders", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/finance", labelKey: "nav.finance", roles: ["admin"] },
  { href: "/promos", labelKey: "nav.promos", roles: ["admin"] },
  { href: "/audit", labelKey: "nav.audit", roles: ["admin"] }
];

const normalizeRole = (role) => String(role || "support").toLowerCase();

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user } = useAuth();
  const role = useMemo(() => normalizeRole(user?.role), [user]);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">{t("app.title")}</div>
        <div className="brand-subtitle">{t("app.subtitle")}</div>
      </div>
      <nav className="nav">
        {navItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : undefined}
            >
              {t(item.labelKey)}
            </Link>
          ))}
      </nav>
    </aside>
  );
}

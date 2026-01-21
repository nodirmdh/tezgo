"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/users", label: "Users", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/clients", label: "Clients", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/partners", label: "Partners", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/outlets", label: "Outlets", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/couriers", label: "Couriers", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/orders", label: "Orders", roles: ["admin", "support", "operator", "read-only"] },
  { href: "/finance", label: "Finance", roles: ["admin"] },
  { href: "/promos", label: "Promos", roles: ["admin"] },
  { href: "/audit", label: "Audit", roles: ["admin"] }
];

const normalizeRole = (role) => String(role || "support").toLowerCase();

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState("support");

  useEffect(() => {
    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored);
    setRole(normalizeRole(parsed.role));
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">Kungrad Admin</div>
        <div className="brand-subtitle">
          Операционные инструменты для саппорта
        </div>
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
              {item.label}
            </Link>
          ))}
      </nav>
    </aside>
  );
}

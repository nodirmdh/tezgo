"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/clients", label: "Clients" },
  { href: "/partners", label: "Partners" },
  { href: "/outlets", label: "Outlets" },
  { href: "/couriers", label: "Couriers" },
  { href: "/orders", label: "Orders" },
  { href: "/finance", label: "Finance" }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">Kungrad Admin</div>
        <div className="brand-subtitle">Панель управления доставкой</div>
      </div>
      <nav className="nav">
        {navItems.map((item) => (
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

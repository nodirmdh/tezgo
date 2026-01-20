import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Kungrad Admin",
  description: "Admin panel for Kungrad Delivery Platform"
};

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

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-title">Kungrad Admin</div>
              <div className="brand-subtitle">Панель управления доставкой</div>
            </div>
            <nav className="nav">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}

import "./globals.css";
import AuthGuard from "./components/AuthGuard";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "Kungrad Admin",
  description: "Admin panel for Kungrad Delivery Platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AuthGuard>
          <div className="layout">
            <Sidebar />
            <div className="content">{children}</div>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}

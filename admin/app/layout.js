import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "Kungrad Admin",
  description: "Admin panel for Kungrad Delivery Platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <div className="layout">
          <Sidebar />
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}

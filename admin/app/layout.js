import "./globals.css";
import AuthGuard from "./components/AuthGuard";
import Sidebar from "./components/Sidebar";
import GlobalSearch from "./components/GlobalSearch";
import { LocaleProvider } from "./components/LocaleProvider";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { AuthProvider } from "./components/AuthProvider";

export const metadata = {
  title: "Kungrad Admin",
  description: "Admin panel for Kungrad Delivery Platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <LocaleProvider>
          <AuthProvider>
            <AuthGuard>
              <div className="layout">
                <Sidebar />
                <div className="content">
                  <div className="topbar">
                    <GlobalSearch />
                    <LanguageSwitcher />
                  </div>
                  {children}
                </div>
              </div>
            </AuthGuard>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

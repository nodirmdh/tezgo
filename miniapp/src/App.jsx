import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import HomePage from "./pages/HomePage.jsx";
import ClientPage from "./pages/ClientPage.jsx";
import RestaurantPage from "./pages/RestaurantPage.jsx";
import CourierPage from "./pages/CourierPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";

const AppShell = ({ children }) => (
  <div className="app">
    <header className="nav">
      <div className="brand">
        <span className="brand-mark">K</span>
        <div>
          <div className="brand-title">Kungrad Delivery</div>
          <div className="brand-subtitle">Mini App Suite</div>
        </div>
      </div>
      <nav className="nav-links">
        <NavLink to="/" end>
          Главная
        </NavLink>
        <NavLink to="/client">Client</NavLink>
        <NavLink to="/restaurant">Restaurant</NavLink>
        <NavLink to="/courier">Courier</NavLink>
      </nav>
    </header>
    <main className="content">{children}</main>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/client/login" element={<LoginPage role="client" />} />
            <Route path="/client/register" element={<RegisterPage />} />
            <Route
              path="/client/change-password"
              element={
                <RequireAuth role="client">
                  <ChangePasswordPage role="client" />
                </RequireAuth>
              }
            />
            <Route
              path="/client"
              element={
                <RequireAuth role="client">
                  <ClientPage />
                </RequireAuth>
              }
            />
            <Route path="/restaurant/login" element={<LoginPage role="partner" />} />
            <Route
              path="/restaurant/change-password"
              element={
                <RequireAuth role="partner">
                  <ChangePasswordPage role="partner" />
                </RequireAuth>
              }
            />
            <Route
              path="/restaurant"
              element={
                <RequireAuth role="partner">
                  <RestaurantPage />
                </RequireAuth>
              }
            />
            <Route path="/courier/login" element={<LoginPage role="courier" />} />
            <Route
              path="/courier/change-password"
              element={
                <RequireAuth role="courier">
                  <ChangePasswordPage role="courier" />
                </RequireAuth>
              }
            />
            <Route
              path="/courier"
              element={
                <RequireAuth role="courier">
                  <CourierPage />
                </RequireAuth>
              }
            />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}

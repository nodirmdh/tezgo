import { BrowserRouter, NavLink, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import HomePage from "./pages/HomePage.jsx";
import ClientPage from "./pages/ClientPage.jsx";
import ClientPointsPage from "./pages/client/ClientPointsPage.jsx";
import ClientPointMenuPage from "./pages/client/ClientPointMenuPage.jsx";
import ClientCartPage from "./pages/client/ClientCartPage.jsx";
import ClientCheckoutPage from "./pages/client/ClientCheckoutPage.jsx";
import ClientOrdersPage from "./pages/client/ClientOrdersPage.jsx";
import ClientOrderStatusPage from "./pages/client/ClientOrderStatusPage.jsx";
import RestaurantPage from "./pages/RestaurantPage.jsx";
import CourierPage from "./pages/CourierPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";

const variant = import.meta.env.VITE_APP_VARIANT || "all";
const isClient = variant == "client";
const isPartner = variant == "partner";
const isCourier = variant == "courier";
const showAll = variant == "all";

const AppShell = ({ children }) => (
  <div className="app">
    <header className="nav">
      <div className="brand">
        <span className="brand-mark">K</span>
        <div>
          <div className="brand-title">Kungrad Delivery</div>
          <div className="brand-subtitle">
            {showAll ? "Mini App Suite" : "Telegram Mini App"}
          </div>
        </div>
      </div>
      {showAll ? (
        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/client">Client</NavLink>
          <NavLink to="/restaurant">Restaurant</NavLink>
          <NavLink to="/courier">Courier</NavLink>
        </nav>
      ) : null}
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
            {showAll ? <Route path="/" element={<HomePage />} /> : null}
            {isClient ? <Route path="/" element={<Navigate to="/client" replace />} /> : null}
            {isPartner ? (
              <Route path="/" element={<Navigate to="/restaurant" replace />} />
            ) : null}
            {isCourier ? (
              <Route path="/" element={<Navigate to="/courier" replace />} />
            ) : null}

            {showAll || isClient ? (
              <>
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
                <Route
                  path="/client/points"
                  element={
                    <RequireAuth role="client">
                      <ClientPointsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/client/points/:id"
                  element={
                    <RequireAuth role="client">
                      <ClientPointMenuPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/client/cart"
                  element={
                    <RequireAuth role="client">
                      <ClientCartPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/client/checkout"
                  element={
                    <RequireAuth role="client">
                      <ClientCheckoutPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/client/orders"
                  element={
                    <RequireAuth role="client">
                      <ClientOrdersPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/client/orders/:id"
                  element={
                    <RequireAuth role="client">
                      <ClientOrderStatusPage />
                    </RequireAuth>
                  }
                />
              </>
            ) : null}

            {showAll || isPartner ? (
              <>
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
              </>
            ) : null}

            {showAll || isCourier ? (
              <>
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
              </>
            ) : null}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}

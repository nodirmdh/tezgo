import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ClientPage from "./pages/ClientPage.jsx";
import RestaurantPage from "./pages/RestaurantPage.jsx";
import CourierPage from "./pages/CourierPage.jsx";

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
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/client" element={<ClientPage />} />
          <Route path="/restaurant" element={<RestaurantPage />} />
          <Route path="/courier" element={<CourierPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

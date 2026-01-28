import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../auth/api";
import { useAuth } from "../auth/AuthContext";

const statusLabels = {
  assigned: "Назначен",
  picked_up: "Забрал",
  in_transit: "В пути",
  delivered: "Доставлен",
  closed: "Закрыт",
  ready: "Готов",
  ready_for_pickup: "Готов",
  accepted: "Принят",
  preparing: "Готовится"
};

const tabs = [
  { id: "assigned", label: "Мои заказы" },
  { id: "available", label: "Доступные" }
];

export default function CourierPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("assigned");
  const [assigned, setAssigned] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffCode, setHandoffCode] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(true);

  const loadAssigned = async () => {
    setLoading(true);
    const result = await apiJson("/courier/orders/assigned");
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setAssigned(result.data.items || []);
    setLoading(false);
  };

  const loadAvailable = async () => {
    const result = await apiJson("/courier/orders/available");
    if (!result.ok) {
      if (result.status === 403) {
        setMarketplaceEnabled(false);
        return;
      }
      setError(result.error);
      return;
    }
    setAvailable(result.data.items || []);
  };

  useEffect(() => {
    loadAssigned();
    loadAvailable();
  }, []);

  useEffect(() => {
    if (activeTab === "assigned") {
      loadAssigned();
    } else if (activeTab === "available") {
      loadAvailable();
    }
  }, [activeTab]);

  const openHandoff = (order) => {
    setActiveOrder(order);
    setHandoffCode("");
    setHandoffOpen(true);
  };

  const handleAccept = async (order) => {
    const result = await apiJson(`/courier/orders/${order.id}/accept`, { method: "POST" });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    loadAssigned();
    loadAvailable();
  };

  const handlePickedUp = async (order) => {
    const result = await apiJson(`/courier/orders/${order.id}/picked-up`, { method: "POST" });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    loadAssigned();
  };

  const handleInTransit = async (order) => {
    const result = await apiJson(`/courier/orders/${order.id}/in-transit`, { method: "POST" });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    loadAssigned();
  };

  const handleDelivered = async () => {
    if (!activeOrder) return;
    const result = await apiJson(`/courier/orders/${activeOrder.id}/delivered`, {
      method: "POST",
      body: JSON.stringify({ code: handoffCode })
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setHandoffOpen(false);
    loadAssigned();
  };

  const supportMessage = "Отмена курьером недоступна. При проблемах обратитесь в поддержку.";

  const assignedOrders = useMemo(() => assigned, [assigned]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Courier mini app</p>
          <h2>Доставка и статусы</h2>
        </div>
        <div className="status-chip success">User: {user?.username || user?.id}</div>
      </div>
      <div className="action-row">
        <button className="ghost" type="button" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.id === "available" && !marketplaceEnabled}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <div className="auth-error">{error}</div> : null}

      {activeTab === "assigned" ? (
        <div className="panel">
          {loading ? (
            <div className="muted">Загрузка...</div>
          ) : (
            <div className="queue">
              {assignedOrders.map((order) => (
                <div key={order.id} className="queue-card">
                  <div>
                    <div className="queue-number">{order.order_number}</div>
                    <div className="muted">{order.outlet_name}</div>
                    <div className="muted">Ресторан: {order.outlet_address}</div>
                    <div className="muted">Клиент: {order.delivery_address}</div>
                    {order.customer_comment ? (
                      <div className="muted">Комментарий: {order.customer_comment}</div>
                    ) : null}
                    {order.handoff_code ? (
                      <div className="muted">Код выдачи: {order.handoff_code}</div>
                    ) : null}
                  </div>
                  <div className="queue-actions">
                    <span className="pill">{statusLabels[order.status] || order.status}</span>
                    {order.status !== "picked_up" && order.status !== "in_transit" ? (
                      <button className="primary" type="button" onClick={() => handlePickedUp(order)}>
                        Забрал
                      </button>
                    ) : null}
                    {order.status === "picked_up" ? (
                      <button className="primary" type="button" onClick={() => handleInTransit(order)}>
                        В пути
                      </button>
                    ) : null}
                    {order.status === "in_transit" ? (
                      <button className="primary" type="button" onClick={() => openHandoff(order)}>
                        Доставил
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!assignedOrders.length ? <div className="muted">Активных заказов нет.</div> : null}
            </div>
          )}
          <div className="banner" style={{ marginTop: "12px" }}>
            {supportMessage}
          </div>
        </div>
      ) : null}

      {activeTab === "available" ? (
        <div className="panel">
          {!marketplaceEnabled ? (
            <div className="muted">Marketplace режим отключен.</div>
          ) : (
            <div className="queue">
              {available.map((order) => (
                <div key={order.id} className="queue-card">
                  <div>
                    <div className="queue-number">{order.order_number}</div>
                    <div className="muted">{order.outlet_name}</div>
                    <div className="muted">Клиент: {order.delivery_address}</div>
                  </div>
                  <div className="queue-actions">
                    <span className="pill">{statusLabels[order.status] || order.status}</span>
                    <button className="primary" type="button" onClick={() => handleAccept(order)}>
                      Взять
                    </button>
                  </div>
                </div>
              ))}
              {!available.length ? <div className="muted">Доступных заказов нет.</div> : null}
            </div>
          )}
        </div>
      ) : null}

      {handoffOpen ? (
        <div className="modal-backdrop" onClick={() => setHandoffOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Подтвердить доставку</h3>
            <input
              className="auth-input"
              value={handoffCode}
              onChange={(event) => setHandoffCode(event.target.value)}
              placeholder="Введите код"
            />
            <div className="action-row" style={{ marginTop: "16px" }}>
              <button className="primary" type="button" onClick={handleDelivered}>
                Подтвердить
              </button>
              <button className="ghost" type="button" onClick={() => setHandoffOpen(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function OrderOverview({ order }) {
  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">Детали заказа</div>
        <div className="profile-row">
          <span className="muted">Order ID</span>
          <span>{order.order_number}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Статус</span>
          <span>{order.status}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Сумма</span>
          <span>{order.total_amount ? `${order.total_amount} сум` : "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Адрес</span>
          <span>{order.delivery_address || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Создан</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">Связанные сущности</div>
        <div className="profile-row">
          <span className="muted">Клиент</span>
          <span>
            {order.client_name || "-"} ({order.client_phone || "-"})
          </span>
        </div>
        <div className="profile-row">
          <span className="muted">TG</span>
          <span>{order.client_username || order.client_tg_id || "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Курьер</span>
          <span>{order.courier_user_id ?? "-"}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Ресторан</span>
          <span>{order.outlet_name || "-"}</span>
        </div>
      </section>
    </div>
  );
}

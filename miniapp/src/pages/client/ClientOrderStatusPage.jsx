import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiJson } from "../../auth/api";

const statusLabels = {
  created: "Новый",
  pending_partner: "Ожидает подтверждения",
  accepted: "Принят",
  preparing: "Готовится",
  accepted_by_restaurant: "Принят",
  ready: "Готов",
  ready_for_pickup: "Готов",
  handed_over: "Выдан",
  picked_up: "Передан курьеру",
  delivered: "Доставлен",
  closed: "Закрыт",
  rejected: "Отклонён",
  cancelled: "Отменён"
};

export default function ClientOrderStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrder = async () => {
    setLoading(true);
    const result = await apiJson(`/client/orders/${id}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setOrder(result.data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const timeline = useMemo(() => {
    if (!order?.timeline) return [];
    const entries = [
      { key: "created", label: "Создан", at: order.timeline.created_at },
      { key: "accepted", label: "Принят", at: order.timeline.accepted_at },
      { key: "ready", label: "Готов", at: order.timeline.ready_at },
      { key: "handed_over", label: "Выдан", at: order.timeline.handed_over_at },
      { key: "delivered", label: "Доставлен", at: order.timeline.delivered_at },
      { key: "closed", label: "Закрыт", at: order.timeline.closed_at }
    ];
    return entries.filter((entry) => entry.at);
  }, [order]);

  if (loading) {
    return (
      <section className="page">
        <div className="panel">Загрузка заказа...</div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="page">
        <div className="panel">Заказ не найден.</div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Статус заказа</p>
          <h2>{order.order_number}</h2>
        </div>
        <button className="ghost" type="button" onClick={() => navigate(-1)}>
          Назад
        </button>
      </div>
      <div className="panel">
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="status-chip">
          {statusLabels[order.status] || order.status}
        </div>
        {order.reject_reason ? (
          <div className="banner error">Причина отказа: {order.reject_reason}</div>
        ) : null}
        {order.handoff_code ? (
          <div className="banner">Код выдачи: {order.handoff_code}</div>
        ) : null}
        {timeline.length ? (
          <div className="timeline">
            {timeline.map((entry) => (
              <div key={entry.key} className="timeline-row">
                <span>{entry.label}</span>
                <span className="muted">
                  {new Date(entry.at).toLocaleString("ru-RU")}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {order.items?.length ? (
          <div className="catalog-block">
            <div className="catalog-title">Состав</div>
            {order.items.map((item) => (
              <div key={item.id} className="catalog-item">
                <span>{item.title}</span>
                <span>
                  {item.quantity} × {item.unit_price}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="catalog-block">
          <div className="catalog-title">Итоги</div>
          <div className="catalog-item">
            <span>Сумма блюд</span>
            <span>{order.food_total} сум</span>
          </div>
          <div className="catalog-item">
            <span>Сервисный сбор</span>
            <span>{order.service_fee} сум</span>
          </div>
          <div className="catalog-item">
            <span>Итого</span>
            <span>{order.total_amount || order.food_total + order.service_fee} сум</span>
          </div>
        </div>
        <div className="action-row">
          <button className="ghost" type="button">
            Связаться с поддержкой
          </button>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiJson } from "../../auth/api";
import { clearCart, getCartTotals, readCart } from "./cartStore";

export default function ClientCheckoutPage() {
  const navigate = useNavigate();
  const [cart] = useState(readCart());
  const [fulfillment, setFulfillment] = useState("delivery");
  const [address, setAddress] = useState("");
  const [addressComment, setAddressComment] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [comment, setComment] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cart.items.length) {
      navigate("/client/points", { replace: true });
    }
  }, [cart.items.length, navigate]);

  useEffect(() => {
    const loadSlots = async () => {
      if (fulfillment !== "pickup" || !cart.pointId) {
        return;
      }
      const result = await apiJson(`/client/points/${cart.pointId}/pickup-slots`);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSlots(result.data.items || []);
      if (!pickupTime && result.data.items?.length) {
        setPickupTime(result.data.items[0]);
      }
    };
    loadSlots();
  }, [fulfillment, cart.pointId]);

  const totals = getCartTotals(cart);

  const handleSubmit = async () => {
    setError(null);
    if (fulfillment === "delivery" && !address.trim()) {
      setError("Укажите адрес доставки.");
      return;
    }
    if (fulfillment === "pickup" && !pickupTime) {
      setError("Выберите время самовывоза.");
      return;
    }
    setLoading(true);
    const result = await apiJson("/client/orders", {
      method: "POST",
      body: JSON.stringify({
        pointId: Number(cart.pointId),
        fulfillment_type: fulfillment,
        pickup_time: fulfillment === "pickup" ? pickupTime : null,
        address: fulfillment === "delivery" ? address : null,
        address_comment: fulfillment === "delivery" ? addressComment : null,
        utensils_count: peopleCount,
        napkins_count: peopleCount,
        customer_comment: comment,
        items: cart.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity
        }))
      })
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    clearCart();
    navigate(`/client/orders/${result.data.orderId}`);
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Оформление</p>
          <h2>Заказ</h2>
        </div>
      </div>
      <div className="panel">
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="form-row">
          <div className="auth-field">
            <label className="auth-label">Способ получения</label>
            <div className="chip-row">
              <button
                type="button"
                className={fulfillment === "delivery" ? "chip active" : "chip"}
                onClick={() => setFulfillment("delivery")}
              >
                Доставка
              </button>
              <button
                type="button"
                className={fulfillment === "pickup" ? "chip active" : "chip"}
                onClick={() => setFulfillment("pickup")}
              >
                Самовывоз
              </button>
            </div>
          </div>
        </div>
        {fulfillment === "delivery" ? (
          <div className="form-grid">
            <label className="auth-label">Адрес</label>
            <input
              className="auth-input"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Улица, дом"
            />
            <label className="auth-label">Комментарий к адресу</label>
            <input
              className="auth-input"
              value={addressComment}
              onChange={(event) => setAddressComment(event.target.value)}
              placeholder="Подъезд, этаж, домофон"
            />
          </div>
        ) : (
          <div className="form-grid">
            <label className="auth-label">Время самовывоза</label>
            <select
              className="auth-input"
              value={pickupTime}
              onChange={(event) => setPickupTime(event.target.value)}
            >
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {new Date(slot).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-grid">
          <label className="auth-label">Кол-во персон</label>
          <input
            className="auth-input"
            type="number"
            min="1"
            value={peopleCount}
            onChange={(event) => setPeopleCount(Number(event.target.value || 1))}
          />
          <label className="auth-label">Комментарий к заказу</label>
          <textarea
            className="auth-input"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Пожелания к заказу"
          />
        </div>
        <div className="cart-summary">
          <div className="summary-row">
            <span>Сумма блюд</span>
            <span>{totals.food_total} сум</span>
          </div>
          <div className="summary-row">
            <span>Сервисный сбор</span>
            <span>{totals.service_fee} сум</span>
          </div>
          <div className="summary-row total">
            <span>Итого</span>
            <span>{totals.total_amount} сум</span>
          </div>
        </div>
        <div className="action-row">
          <button className="primary" type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Отправляем..." : "Оформить заказ"}
          </button>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCart, getCartTotals, readCart, updateCartItem, writeCart } from "./cartStore";

export default function ClientCartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(readCart());

  useEffect(() => {
    setCart(readCart());
  }, []);

  const handleUpdate = (item, quantity) => {
    const next = updateCartItem({ cart, item, quantity });
    setCart(next);
    writeCart(next);
  };

  const totals = getCartTotals(cart);

  if (!cart.items.length) {
    return (
      <section className="page">
        <div className="panel">
          <h3>Корзина пуста</h3>
          <Link className="primary" to="/client/points">
            В каталог
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Корзина</p>
          <h2>{cart.pointName || "Заказ"}</h2>
        </div>
        <button className="ghost" type="button" onClick={() => navigate(-1)}>
          Назад
        </button>
      </div>
      <div className="panel">
        <div className="menu-list">
          {cart.items.map((item) => (
            <div key={item.itemId} className="menu-card">
              <div>
                <div className="menu-name">{item.name}</div>
                <div className="muted">{item.price} сум</div>
              </div>
              <div className="menu-qty">
                <button
                  className="ghost"
                  type="button"
                  onClick={() => handleUpdate(item, item.quantity - 1)}
                >
                  –
                </button>
                <span>{item.quantity}</span>
                <button
                  className="primary"
                  type="button"
                  onClick={() => handleUpdate(item, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
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
          <Link className="primary" to="/client/checkout">
            Оформить заказ
          </Link>
          <button className="ghost" type="button" onClick={() => {
            clearCart();
            setCart(readCart());
          }}>
            Очистить
          </button>
        </div>
      </div>
    </section>
  );
}

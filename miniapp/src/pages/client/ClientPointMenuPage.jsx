import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiJson } from "../../auth/api";
import { readCart, updateCartItem, writeCart } from "./cartStore";

export default function ClientPointMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [point, setPoint] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(readCart());
  const [error, setError] = useState(null);

  const loadPoint = async () => {
    setLoading(true);
    const result = await apiJson(`/client/points/${id}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setPoint(result.data);
    setCategories(result.data.categories || []);
    setLoading(false);
  };

  const loadItems = async (selectedCategoryId = categoryId) => {
    const params = new URLSearchParams({});
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    const result = await apiJson(`/client/points/${id}/items?${params.toString()}`);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items || []);
  };

  useEffect(() => {
    loadPoint();
    loadItems("");
  }, [id]);

  useEffect(() => {
    loadItems(categoryId);
  }, [categoryId]);

  const handleUpdate = (item, nextQuantity) => {
    if (cart.pointId && String(cart.pointId) !== String(id)) {
      const confirmed = window.confirm(
        "Корзина относится к другой точке. Очистить и добавить новую позицию?"
      );
      if (!confirmed) return;
      const next = updateCartItem({
        cart: { pointId: null, pointName: null, items: [] },
        pointId: Number(id),
        pointName: point?.name,
        item,
        quantity: nextQuantity
      });
      setCart(next);
      writeCart(next);
      return;
    }
    const next = updateCartItem({
      cart,
      pointId: Number(id),
      pointName: point?.name,
      item,
      quantity: nextQuantity
    });
    setCart(next);
    writeCart(next);
  };

  const quantities = useMemo(() => {
    const map = new Map();
    cart.items.forEach((entry) => map.set(entry.itemId, entry.quantity));
    return map;
  }, [cart]);

  const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <section className="page">
        <div className="panel">Загрузка меню...</div>
      </section>
    );
  }

  if (!point) {
    return (
      <section className="page">
        <div className="panel">Точка не найдена.</div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Меню точки</p>
          <h2>{point.name}</h2>
        </div>
        <button className="ghost" type="button" onClick={() => navigate(-1)}>
          Назад
        </button>
      </div>
      <div className="panel">
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="chip-row">
          <button
            className={categoryId === "" ? "chip active" : "chip"}
            type="button"
            onClick={() => setCategoryId("")}
          >
            Все
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={categoryId === String(category.id) ? "chip active" : "chip"}
              type="button"
              onClick={() => setCategoryId(String(category.id))}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="menu-list">
          {items.map((item) => {
            const qty = quantities.get(item.id) || 0;
            return (
              <div key={item.id} className="menu-card">
                <div>
                  <div className="menu-name">{item.name}</div>
                  <div className="muted">{item.price} сум</div>
                </div>
                <div className="menu-qty">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => handleUpdate(
                      {
                        itemId: item.id,
                        name: item.name,
                        price: item.price
                      },
                      qty - 1
                    )}
                    disabled={qty === 0}
                  >
                    –
                  </button>
                  <span>{qty}</span>
                  <button
                    className="primary"
                    type="button"
                    onClick={() => handleUpdate(
                      {
                        itemId: item.id,
                        name: item.name,
                        price: item.price
                      },
                      qty + 1
                    )}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
          {!items.length ? <div className="muted">Позиции отсутствуют.</div> : null}
        </div>
      </div>
      {totalCount > 0 ? (
        <div className="bottom-bar">
          <div>
            Корзина: {totalCount} позиций
          </div>
          <Link className="primary" to="/client/cart">
            Перейти
          </Link>
        </div>
      ) : null}
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../auth/api";
import { useAuth } from "../auth/AuthContext";

const statusLabels = {
  draft: "Заполните реквизиты",
  submitted: "На проверке",
  verified: "Подтверждено",
  rejected: "Отклонено"
};

const tabs = [
  { id: "requisites", label: "Реквизиты" },
  { id: "orders", label: "Заказы" },
  { id: "menu", label: "Меню" }
];

const emptyItem = {
  id: null,
  name: "",
  description: "",
  price: "",
  is_available: true,
  categoryId: "",
  categoryName: ""
};

export default function RestaurantPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("requisites");
  const [partner, setPartner] = useState(null);
  const [form, setForm] = useState({});
  const [orders, setOrders] = useState([]);
  const [points, setPoints] = useState([]);
  const [pointId, setPointId] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const status = partner?.verification_status || "draft";
  const statusText = statusLabels[status] || "Заполните реквизиты";
  const isLocked = status === "verified";
  const isReview = status === "submitted";

  const loadPartner = async () => {
    const result = await apiJson("/partner/me");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPartner(result.data);
    setForm(result.data);
  };

  const loadOrders = async () => {
    const result = await apiJson("/partner/orders");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrders(result.data.items || []);
  };

  const loadPoints = async () => {
    const result = await apiJson("/partner/points");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const items = result.data.items || [];
    setPoints(items);
    if (!pointId && items.length) {
      setPointId(String(items[0].id));
    }
  };

  const loadCategories = async (selectedPointId) => {
    if (!selectedPointId) return;
    const result = await apiJson(`/partner/points/${selectedPointId}/categories`);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCategories(result.data.items || []);
  };

  const loadItems = async (selectedPointId) => {
    if (!selectedPointId) return;
    const params = new URLSearchParams({});
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (search) params.set("q", search);
    const result = await apiJson(`/partner/points/${selectedPointId}/items?${params}`);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items || []);
  };

  useEffect(() => {
    loadPartner();
    loadOrders();
    loadPoints();
  }, []);

  useEffect(() => {
    if (!pointId) return;
    loadCategories(pointId);
    loadItems(pointId);
  }, [pointId]);

  useEffect(() => {
    if (!pointId) return;
    const timer = setTimeout(() => loadItems(pointId), 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await apiJson("/partner/me", {
      method: "PUT",
      body: JSON.stringify(form)
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPartner(result.data);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    const result = await apiJson("/partner/me/submit", { method: "POST" });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPartner(result.data);
  };

  const bannerClass = useMemo(() => {
    if (status === "verified") return "status-chip success";
    if (status === "rejected") return "status-chip danger";
    if (status === "submitted") return "status-chip warning";
    return "status-chip";
  }, [status]);

  const openCreate = () => {
    setItemForm(emptyItem);
    setCategoryInput("");
    setCategoryOpen(false);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setItemForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: String(item.price || ""),
      is_available: Boolean(item.is_available),
      categoryId: item.category_id ? String(item.category_id) : "",
      categoryName: ""
    });
    setCategoryInput(item.category_name || "");
    setCategoryOpen(false);
    setModalOpen(true);
  };

  const handleCategorySelect = (category) => {
    setItemForm((prev) => ({
      ...prev,
      categoryId: String(category.id),
      categoryName: ""
    }));
    setCategoryInput(category.name);
    setCategoryOpen(false);
  };

  const handleCategoryCreate = () => {
    const name = categoryInput.trim();
    if (!name) return;
    setItemForm((prev) => ({ ...prev, categoryId: "", categoryName: name }));
    setCategoryOpen(false);
  };

  const saveItem = async () => {
    if (!pointId) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || null,
      price: Number(itemForm.price),
      is_available: Boolean(itemForm.is_available),
      categoryId: itemForm.categoryId ? Number(itemForm.categoryId) : undefined,
      categoryName: !itemForm.categoryId && itemForm.categoryName ? itemForm.categoryName : undefined
    };
    const endpoint = itemForm.id
      ? `/partner/points/${pointId}/items/${itemForm.id}`
      : `/partner/points/${pointId}/items`;
    const method = itemForm.id ? "PUT" : "POST";
    const result = await apiJson(endpoint, {
      method,
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data?.category_existing && !itemForm.categoryId) {
      setToast("Категория уже существует, выбрана существующая");
    }
    setModalOpen(false);
    setItemForm(emptyItem);
    await loadCategories(pointId);
    await loadItems(pointId);
  };

  const toggleAvailability = async (item) => {
    if (!pointId) return;
    const result = await apiJson(
      `/partner/points/${pointId}/items/${item.id}/availability`,
      {
        method: "PATCH",
        body: JSON.stringify({ is_available: !Boolean(item.is_available) })
      }
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await loadItems(pointId);
  };

  const categoryMatches = categories.filter((category) =>
    categoryInput
      ? category.name.toLowerCase().includes(categoryInput.toLowerCase())
      : true
  );
  const hasExactCategory = categoryInput
    ? categories.some(
        (category) => category.name.toLowerCase() === categoryInput.toLowerCase().trim()
      )
    : false;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Partner mini app</p>
          <h2>Профиль партнёра</h2>
          {error ? <div className="auth-error">{error}</div> : null}
        </div>
        <div className={bannerClass}>{statusText}</div>
      </div>
      <div className="action-row">
        <button className="ghost" type="button" onClick={logout}>
          Log out ({user?.username || user?.id})
        </button>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {toast ? <div className="banner">{toast}</div> : null}

      {activeTab === "requisites" ? (
        <div className="grid two">
          <div className="panel">
            <h3>Реквизиты</h3>
            {status === "rejected" && partner?.verification_comment ? (
              <div className="banner error">{partner.verification_comment}</div>
            ) : null}
            <div className="form-grid">
              <label className="auth-label">Отображаемое название</label>
              <input
                className="auth-input"
                value={form.display_name || ""}
                onChange={handleChange("display_name")}
                disabled={isReview || isLocked}
              />
              <label className="auth-label">Юр. название</label>
              <input
                className="auth-input"
                value={form.legal_name || ""}
                onChange={handleChange("legal_name")}
                disabled={isReview || isLocked}
              />
              <label className="auth-label">ИНН</label>
              <input
                className="auth-input"
                value={form.inn || ""}
                onChange={handleChange("inn")}
                disabled={isReview || isLocked}
              />
              <label className="auth-label">Тип</label>
              <select
                className="auth-input"
                value={form.legal_type || "other"}
                onChange={handleChange("legal_type")}
                disabled={isReview || isLocked}
              >
                <option value="ip">ИП</option>
                <option value="ooo">ООО</option>
                <option value="other">Другое</option>
              </select>
              <label className="auth-label">Директор</label>
              <input
                className="auth-input"
                value={form.director_full_name || ""}
                onChange={handleChange("director_full_name")}
                disabled={isReview || isLocked}
              />
              <label className="auth-label">Телефон</label>
              <input
                className="auth-input"
                value={form.phone || ""}
                onChange={handleChange("phone")}
                disabled={isReview}
              />
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                value={form.email || ""}
                onChange={handleChange("email")}
                disabled={isReview}
              />
              <label className="auth-label">Юр. адрес</label>
              <input
                className="auth-input"
                value={form.legal_address || ""}
                onChange={handleChange("legal_address")}
                disabled={isReview || isLocked}
              />
              <label className="auth-label">Банк</label>
              <input
                className="auth-input"
                value={form.bank_name || ""}
                onChange={handleChange("bank_name")}
                disabled={isReview || isLocked}
              />
              <label className="auth-label">Счет</label>
              <input
                className="auth-input"
                value={form.bank_account || ""}
                onChange={handleChange("bank_account")}
                disabled={isReview || isLocked}
              />
              <label className="auth-label">МФО/БИК</label>
              <input
                className="auth-input"
                value={form.bank_mfo || ""}
                onChange={handleChange("bank_mfo")}
                disabled={isReview || isLocked}
              />
            </div>
            <div className="action-row">
              <button className="primary" type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                className="ghost"
                type="button"
                onClick={handleSubmit}
                disabled={saving || status === "submitted"}
              >
                Отправить на проверку
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Заказы</h3>
            <div className="queue">
              {orders.map((order) => (
                <div key={order.id} className="queue-card">
                  <div>
                    <div className="queue-number">{order.order_number}</div>
                    <div className="muted">{order.outlet_name}</div>
                    {order.handoff_code ? (
                      <div className="muted">Код выдачи: {order.handoff_code}</div>
                    ) : null}
                  </div>
                  <div className="queue-actions">
                    <span className="pill">{order.status}</span>
                    {order.fulfillment_type === "pickup" ? (
                      <span className="pill">Самовывоз</span>
                    ) : null}
                  </div>
                </div>
              ))}
              {orders.length === 0 ? (
                <div className="muted">Нет активных заказов.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div className="panel">
          <h3>Заказы</h3>
          <div className="queue">
            {orders.map((order) => (
              <div key={order.id} className="queue-card">
                <div>
                  <div className="queue-number">{order.order_number}</div>
                  <div className="muted">{order.outlet_name}</div>
                  {order.handoff_code ? (
                    <div className="muted">Код выдачи: {order.handoff_code}</div>
                  ) : null}
                </div>
                <div className="queue-actions">
                  <span className="pill">{order.status}</span>
                  {order.fulfillment_type === "pickup" ? (
                    <span className="pill">Самовывоз</span>
                  ) : null}
                </div>
              </div>
            ))}
            {orders.length === 0 ? (
              <div className="muted">Нет активных заказов.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "menu" ? (
        <div className="grid">
          <div className="panel">
            <div className="form-row">
              <div className="auth-field">
                <label className="auth-label">Точка</label>
                <select
                  className="auth-input"
                  value={pointId}
                  onChange={(event) => setPointId(event.target.value)}
                >
                  {points.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label className="auth-label">Поиск</label>
                <input
                  className="auth-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Название позиции"
                />
              </div>
            </div>

            <div className="chip-row">
              <button
                type="button"
                className={categoryFilter === "" ? "chip active" : "chip"}
                onClick={() => setCategoryFilter("")}
              >
                Все категории
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={categoryFilter === String(category.id) ? "chip active" : "chip"}
                  onClick={() => setCategoryFilter(String(category.id))}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="menu-list">
              {items.map((item) => (
                <div key={item.id} className="menu-card">
                  <div>
                    <div className="menu-name">{item.name}</div>
                    <div className="muted">
                      {item.category_name || "Без категории"} · {item.price} сум
                    </div>
                  </div>
                  <div className="menu-actions">
                    <button
                      className={item.is_available ? "pill success" : "pill danger"}
                      type="button"
                      onClick={() => toggleAvailability(item)}
                    >
                      {item.is_available ? "Доступно" : "Недоступно"}
                    </button>
                    <button className="ghost" type="button" onClick={() => openEdit(item)}>
                      Редактировать
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 ? (
                <div className="muted">Позиции пока не добавлены.</div>
              ) : null}
            </div>
            <div className="action-row">
              <button className="primary" type="button" onClick={openCreate}>
                Добавить позицию
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>{itemForm.id ? "Редактировать позицию" : "Новая позиция"}</h3>
            <div className="form-grid">
              <label className="auth-label">Название</label>
              <input
                className="auth-input"
                value={itemForm.name}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <label className="auth-label">Описание</label>
              <input
                className="auth-input"
                value={itemForm.description}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
              <label className="auth-label">Цена (сум)</label>
              <input
                className="auth-input"
                value={itemForm.price}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, price: event.target.value }))
                }
              />
              <label className="auth-label">Категория</label>
              <div className="combobox">
                <input
                  className="auth-input"
                  value={categoryInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCategoryInput(value);
                    setItemForm((prev) => ({ ...prev, categoryId: "", categoryName: value }));
                    setCategoryOpen(true);
                  }}
                  onFocus={() => setCategoryOpen(true)}
                  placeholder="Начните вводить категорию"
                />
                {categoryOpen ? (
                  <div className="combo-list">
                    {categoryMatches.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className="combo-item"
                        onClick={() => handleCategorySelect(category)}
                      >
                        {category.name}
                      </button>
                    ))}
                    {!hasExactCategory && categoryInput.trim() ? (
                      <button type="button" className="combo-item" onClick={handleCategoryCreate}>
                        Создать “{categoryInput.trim()}”
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={itemForm.is_available}
                  onChange={(event) =>
                    setItemForm((prev) => ({ ...prev, is_available: event.target.checked }))
                  }
                />
                Доступно
              </label>
            </div>
            <div className="action-row" style={{ marginTop: "16px" }}>
              <button className="primary" type="button" onClick={saveItem} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button className="ghost" type="button" onClick={() => setModalOpen(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

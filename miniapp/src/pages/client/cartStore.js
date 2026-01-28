const CART_KEY = "client_cart_v1";

const emptyCart = {
  pointId: null,
  pointName: null,
  items: []
};

export const readCart = () => {
  if (typeof window === "undefined") return { ...emptyCart };
  try {
    const stored = window.localStorage.getItem(CART_KEY);
    if (!stored) return { ...emptyCart };
    const parsed = JSON.parse(stored);
    return {
      pointId: parsed.pointId ?? null,
      pointName: parsed.pointName ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : []
    };
  } catch {
    return { ...emptyCart };
  }
};

export const writeCart = (cart) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const clearCart = () => {
  writeCart({ ...emptyCart });
};

export const getCartTotals = (cart) => {
  const itemsTotal = cart.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  return {
    food_total: itemsTotal,
    service_fee: cart.items.length ? 3000 : 0,
    total_amount: itemsTotal + (cart.items.length ? 3000 : 0)
  };
};

export const updateCartItem = ({ cart, pointId, pointName, item, quantity }) => {
  const next = {
    pointId: cart.pointId ?? pointId ?? null,
    pointName: cart.pointName ?? pointName ?? null,
    items: [...cart.items]
  };

  const index = next.items.findIndex((entry) => entry.itemId === item.itemId);
  if (quantity <= 0) {
    if (index >= 0) {
      next.items.splice(index, 1);
    }
  } else if (index >= 0) {
    next.items[index] = { ...next.items[index], quantity };
  } else {
    next.items.push({ ...item, quantity });
  }
  if (!next.items.length) {
    return { ...emptyCart };
  }
  return next;
};

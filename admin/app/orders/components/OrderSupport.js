"use client";

import OrderActions from "./OrderActions";

export default function OrderSupport({ orderId, role }) {
  return <OrderActions orderId={orderId} role={role} />;
}

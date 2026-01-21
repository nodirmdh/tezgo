"use client";

import { useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";

const canManageOrders = (role) =>
  ["admin", "support", "operator"].includes(normalizeRole(role));

export default function OrderSupport({ orderId, role }) {
  const [toast, setToast] = useState(null);
  const [courierId, setCourierId] = useState("");

  const handleCancel = async () => {
    const reason = window.prompt("Причина отмены", "");
    const result = await apiJson(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Заказ отменен" });
  };

  const handleReassign = async () => {
    if (!courierId) {
      return;
    }
    const result = await apiJson(`/api/orders/${orderId}/reassign`, {
      method: "POST",
      body: JSON.stringify({ courier_user_id: Number(courierId) })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Курьер назначен" });
    setCourierId("");
  };

  const canManage = canManageOrders(role);

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-title">Support actions</div>
      {!canManage ? (
        <div className="empty-state">Недостаточно прав</div>
      ) : (
        <div className="action-grid">
          <button className="button danger" type="button" onClick={handleCancel}>
            Cancel order
          </button>
          <div className="form-row two">
            <input
              className="input"
              placeholder="Courier ID"
              value={courierId}
              onChange={(event) => setCourierId(event.target.value)}
            />
            <button className="button" type="button" onClick={handleReassign}>
              Reassign courier
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

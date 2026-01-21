"use client";

import { useState } from "react";
import Toast from "../../components/Toast";
import { apiJson } from "../../../lib/api/client";
import PromoOverview from "./PromoOverview";

export default function PromoProfileClient({ promoId, initialPromo }) {
  const [promo, setPromo] = useState(initialPromo);
  const [toast, setToast] = useState(null);

  const handleUpdate = async (payload) => {
    const result = await apiJson(`/api/promos/${promoId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setPromo(result.data);
    setToast({ type: "success", message: "Promo updated" });
  };

  return (
    <div className="profile-wrapper">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="profile-header">
        <div>
          <div className="profile-eyebrow">Promo profile</div>
          <h1>{promo.code}</h1>
          <div className="helper-text">ID: {promo.id}</div>
        </div>
        <div className="profile-role">
          <span className="badge">
            {promo.is_active ? "active" : "inactive"}
          </span>
        </div>
      </div>
      <PromoOverview promo={promo} onUpdate={handleUpdate} />
    </div>
  );
}
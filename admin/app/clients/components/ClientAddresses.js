"use client";

import { useState } from "react";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { normalizeRole } from "../../../lib/rbac";
import {
  createClientAddress,
  deleteClientAddress,
  setPrimaryClientAddress,
  updateClientAddress
} from "../../../lib/api/clientAddressesApi";
import { useLocale } from "../../components/LocaleProvider";

const emptyForm = {
  label: "",
  address_text: "",
  entrance: "",
  floor: "",
  apartment: "",
  comment: "",
  lat: "",
  lng: ""
};

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" type="button" onClick={onClose}>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function ClientAddresses({
  clientId,
  addresses,
  loading,
  error,
  role,
  onReload
}) {
  const { t } = useLocale();
  const [toast, setToast] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { confirm, dialog } = useConfirm();

  const canManage = ["admin", "support"].includes(normalizeRole(role));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (address) => {
    setEditing(address);
    setForm({
      label: address.label || "",
      address_text: address.address_text || "",
      entrance: address.entrance || "",
      floor: address.floor || "",
      apartment: address.apartment || "",
      comment: address.comment || "",
      lat: address.lat ?? "",
      lng: address.lng ?? ""
    });
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.address_text.trim()) {
      setToast({ type: "error", message: t("clients.addresses.required") });
      return;
    }
    const payload = {
      label: form.label || null,
      address_text: form.address_text,
      entrance: form.entrance || null,
      floor: form.floor || null,
      apartment: form.apartment || null,
      comment: form.comment || null,
      lat: form.lat !== "" ? Number(form.lat) : null,
      lng: form.lng !== "" ? Number(form.lng) : null
    };

    const result = editing
      ? await updateClientAddress(clientId, editing.id, payload)
      : await createClientAddress(clientId, payload);

    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("clients.addresses.saved") });
    setOpen(false);
    onReload();
  };

  const handleDelete = (address) => {
    confirm({
      title: t("clients.addresses.deleteTitle"),
      description: t("clients.addresses.deleteDescription"),
      onConfirm: async () => {
        const result = await deleteClientAddress(clientId, address.id);
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("clients.addresses.deleted") });
        onReload();
      }
    });
  };

  const handleSetPrimary = async (address) => {
    const result = await setPrimaryClientAddress(clientId, address.id);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("clients.addresses.primaryUpdated") });
    onReload();
  };

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="profile-title">{t("clients.addresses.title")}</div>
      {error ? <div className="banner error">{t(error)}</div> : null}
      <div className="toolbar">
        <div className="toolbar-actions">
          {canManage ? (
            <button className="button" type="button" onClick={openCreate}>
              {t("clients.addresses.add")}
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="skeleton-block" />
      ) : addresses.length === 0 ? (
        <div className="empty-state">{t("clients.addresses.none")}</div>
      ) : (
        <div className="card-grid">
          {addresses.map((address) => (
            <div key={address.id} className="card">
              <div className="card-title">
                {address.label || t("clients.addresses.address")}
                {address.is_primary ? (
                  <span className="badge" style={{ marginLeft: "8px" }}>
                    {t("clients.addresses.primary")}
                  </span>
                ) : null}
              </div>
              <div className="helper-text">{address.address_text}</div>
              <div className="helper-text">
                {address.entrance
                  ? `${t("clients.addresses.entrance")}: ${address.entrance}`
                  : ""}
                {address.floor ? ` ${t("clients.addresses.floor")}: ${address.floor}` : ""}
                {address.apartment
                  ? ` ${t("clients.addresses.apartment")}: ${address.apartment}`
                  : ""}
              </div>
              {address.comment ? (
                <div className="helper-text">{address.comment}</div>
              ) : null}
              <div className="table-actions">
                {canManage && !address.is_primary ? (
                  <button
                    className="action-link"
                    type="button"
                    onClick={() => handleSetPrimary(address)}
                  >
                    {t("clients.addresses.setPrimary")}
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    className="action-link"
                    type="button"
                    onClick={() => openEdit(address)}
                  >
                    {t("common.edit")}
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    className="action-link"
                    type="button"
                    onClick={() => handleDelete(address)}
                  >
                    {t("common.delete")}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? t("clients.addresses.edit") : t("clients.addresses.add")}
        onClose={() => setOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="auth-field">
              <label htmlFor="addressLabel">{t("clients.addresses.label")}</label>
              <input
                id="addressLabel"
                className="input"
                value={form.label}
                onChange={(event) =>
                  setForm({ ...form, label: event.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row">
            <div className="auth-field">
              <label htmlFor="addressText">{t("clients.addresses.address")}</label>
              <input
                id="addressText"
                className="input"
                required
                value={form.address_text}
                onChange={(event) =>
                  setForm({ ...form, address_text: event.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="addressEntrance">{t("clients.addresses.entrance")}</label>
              <input
                id="addressEntrance"
                className="input"
                value={form.entrance}
                onChange={(event) =>
                  setForm({ ...form, entrance: event.target.value })
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="addressFloor">{t("clients.addresses.floor")}</label>
              <input
                id="addressFloor"
                className="input"
                value={form.floor}
                onChange={(event) =>
                  setForm({ ...form, floor: event.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="addressApartment">{t("clients.addresses.apartment")}</label>
              <input
                id="addressApartment"
                className="input"
                value={form.apartment}
                onChange={(event) =>
                  setForm({ ...form, apartment: event.target.value })
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="addressComment">{t("clients.addresses.comment")}</label>
              <input
                id="addressComment"
                className="input"
                value={form.comment}
                onChange={(event) =>
                  setForm({ ...form, comment: event.target.value })
                }
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="button" type="submit">
              {t("common.save")}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

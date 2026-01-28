"use client";

import { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import Modal from "../../components/Modal";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const emptyForm = { username: "", phone: "", password: "", partner_id: "" };

export default function RoleAccountsPage({ role }) {
  const { locale, t } = useLocale();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, title: "", password: "" });

  const loadUsers = async () => {
    setLoading(true);
    const result = await apiJson(`/admin/users?role=${role}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setUsers(result.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [role]);

  useEffect(() => {
    if (role !== "partner") {
      setPartners([]);
      return;
    }
    apiJson("/admin/partners").then((result) => {
      if (!result.ok) {
        return;
      }
      setPartners(result.data.items || []);
    });
  }, [role]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError(null);
    const payload = {
      role,
      username: form.username.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password.trim() || undefined,
      partner_id: form.partner_id ? Number(form.partner_id) : undefined
    };
    if (!payload.username) {
      setError(t("usersAccounts.validation.usernameRequired"));
      return;
    }
    const result = await apiJson("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUsers((prev) => [result.data.user, ...prev]);
    setForm(emptyForm);
    setModal({
      open: true,
      title: t("usersAccounts.tempPasswordTitle"),
      password: result.data.tempPassword
    });
  };

  const handleResetPassword = async (userId) => {
    setError(null);
    const result = await apiJson(`/admin/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({})
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUsers((prev) =>
      prev.map((item) => (item.id === userId ? result.data.user : item))
    );
    setModal({
      open: true,
      title: t("usersAccounts.resetPasswordTitle"),
      password: result.data.tempPassword
    });
  };

  const handleToggleStatus = async (userId, status) => {
    const nextStatus = status === "active" ? "blocked" : "active";
    const result = await apiJson(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUsers((prev) =>
      prev.map((item) => (item.id === userId ? result.data.user : item))
    );
  };

  return (
    <main>
      <Toast message={error} type="error" onClose={() => setError(null)} />
      <Modal
        open={modal.open}
        title={modal.title}
        onClose={() => setModal({ open: false, title: "", password: "" })}
      >
        <div style={{ padding: "16px" }}>
          <p>{t("usersAccounts.tempPasswordHint")}</p>
          <div className="input" style={{ userSelect: "all" }}>
            {modal.password}
          </div>
        </div>
      </Modal>
      <div className="page-header">
        <h1>{t("usersAccounts.title", { role: t(`roles.${role}`) })}</h1>
        <p>{t("usersAccounts.description", { role: t(`roles.${role}`) })}</p>
      </div>

      <div className="card">
        <div className="card-title">{t("usersAccounts.createTitle")}</div>
        <form onSubmit={handleCreate} className="form-grid">
          <div className="auth-field">
            <label htmlFor="username">{t("usersAccounts.username")}</label>
            <input
              id="username"
              className="input"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="phone">{t("usersAccounts.phoneOptional")}</label>
            <input
              id="phone"
              className="input"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">{t("usersAccounts.passwordOptional")}</label>
            <input
              id="password"
              className="input"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </div>
          {role === "partner" ? (
            <div className="auth-field">
              <label htmlFor="partnerId">{t("usersAccounts.partnerOptional")}</label>
              <select
                id="partnerId"
                className="input"
                value={form.partner_id}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, partner_id: event.target.value }))
                }
              >
                <option value="">{t("usersAccounts.partnerPlaceholder")}</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.display_name || partner.legal_name || partner.name || `#${partner.id}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <button className="button" type="submit">
            {t("usersAccounts.create")}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginTop: 0 }}>
          <div>
            <div className="card-title">{t("usersAccounts.listTitle")}</div>
            <div className="helper-text">
              {loading ? t("common.loading") : t("usersAccounts.count", { count: users.length })}
            </div>
          </div>
          <div className="toolbar-actions">
            <button className="button ghost" type="button" onClick={loadUsers}>
              {t("common.refresh")}
            </button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{t("usersAccounts.table.username")}</th>
              <th>{t("usersAccounts.table.phone")}</th>
              <th>{t("usersAccounts.table.status")}</th>
              <th>{t("usersAccounts.table.mustChange")}</th>
              <th>{t("usersAccounts.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td>{item.username}</td>
                <td>{item.phone || "-"}</td>
                <td>
                  <span className="badge">{translateStatus(locale, item.status)}</span>
                </td>
                <td>{item.mustChangePassword ? t("common.yes") : t("common.no")}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => handleResetPassword(item.id)}
                    >
                      {t("usersAccounts.resetPassword")}
                    </button>
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => handleToggleStatus(item.id, item.status)}
                    >
                      {item.status === "active"
                        ? t("usersAccounts.block")
                        : t("usersAccounts.unblock")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  {t("usersAccounts.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}

"use client";

import { useMemo } from "react";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function UserOverview({
  user,
  role,
  onUpdate,
  onDelete,
  onToast
}) {
  const isAdmin = useMemo(() => role === "Admin", [role]);

  const handleSubmit = async (event, action) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await action(formData);
    event.currentTarget.reset();
  };

  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="profile-title">РћСЃРЅРѕРІРЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ</div>
        <div className="profile-row">
          <span className="muted">TG ID</span>
          <span>{user.tg_id}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Username</span>
          <span>{user.username}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Role</span>
          <span>{user.role}</span>
        </div>
        <div className="profile-row">
          <span className="muted">Status</span>
          <span>{user.status}</span>
        </div>
        <div className="profile-row">
          <span className="muted">CreatedAt</span>
          <span>{formatDate(user.created_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">UpdatedAt</span>
          <span>{formatDate(user.updated_at)}</span>
        </div>
        <div className="profile-row">
          <span className="muted">LastActive</span>
          <span>{formatDate(user.last_active)}</span>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-title">Р”РµР№СЃС‚РІРёСЏ</div>
        <div className="action-grid">
          <form onSubmit={(event) => handleSubmit(event, onUpdate)}>
            <div className="auth-field">
              <label htmlFor="username">РР·РјРµРЅРёС‚СЊ username</label>
              <input
                id="username"
                name="username"
                className="input"
                placeholder="@username"
              />
            </div>
            <button className="button" type="submit">
              РЎРѕС…СЂР°РЅРёС‚СЊ
            </button>
          </form>

          <form onSubmit={(event) => handleSubmit(event, onUpdate)}>
            <div className="auth-field">
              <label htmlFor="role">РР·РјРµРЅРёС‚СЊ СЂРѕР»СЊ</label>
              <select id="role" name="role" className="select">
                <option value="">Р’С‹Р±РµСЂРёС‚Рµ СЂРѕР»СЊ</option>
                <option value="client">client</option>
                <option value="courier">courier</option>
                <option value="partner">partner</option>
                <option value="admin">admin</option>
                <option value="support">support</option>
              </select>
            </div>
            <button className="button" type="submit" disabled={!isAdmin}>
              РР·РјРµРЅРёС‚СЊ СЂРѕР»СЊ
            </button>
            {!isAdmin ? (
              <div className="helper-text">РўРѕР»СЊРєРѕ РґР»СЏ admin</div>
            ) : null}
          </form>

          <form onSubmit={(event) => handleSubmit(event, onUpdate)}>
            <div className="auth-field">
              <label htmlFor="status">Block/Unblock</label>
              <select id="status" name="status" className="select">
                <option value="">Р’С‹Р±РµСЂРёС‚Рµ СЃС‚Р°С‚СѓСЃ</option>
                <option value="active">Unblock</option>
                <option value="blocked">Block</option>
              </select>
            </div>
            <button className="button" type="submit" disabled={!isAdmin}>
              РџСЂРёРјРµРЅРёС‚СЊ
            </button>
          </form>

          {isAdmin ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                await onDelete();
                onToast("РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СѓРґР°Р»РµРЅ", "success");
              }}
            >
              <div className="auth-field">
                <label>РЈРґР°Р»РёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ</label>
                <div className="helper-text">
                  Р”РµР№СЃС‚РІРёРµ РЅРµРѕР±СЂР°С‚РёРјРѕ
                </div>
              </div>
              <button className="button danger" type="submit">
                Delete
              </button>
            </form>
          ) : (
            <div className="helper-text">РЈРґР°Р»РµРЅРёРµ РґРѕСЃС‚СѓРїРЅРѕ С‚РѕР»СЊРєРѕ admin</div>
          )}
        </div>
      </section>
    </div>
  );
}

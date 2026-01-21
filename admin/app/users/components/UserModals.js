"use client";

import { useState } from "react";

const Modal = ({ open, title, onClose, children }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" type="button" onClick={onClose}>
            Г—
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export function CreateUserModal({ onCreate }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button" type="button" onClick={() => setOpen(true)}>
        Р”РѕР±Р°РІРёС‚СЊ
      </button>
      <Modal open={open} title="Р”РѕР±Р°РІРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ" onClose={() => setOpen(false)}>
        <form
          className="form-grid"
          action={onCreate}
          onSubmit={() => setOpen(false)}
        >
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="tgId">TG ID</label>
              <input id="tgId" name="tg_id" className="input" placeholder="TG-1001" />
            </div>
            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" className="input" placeholder="@new_user" />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="role">Р РѕР»СЊ</label>
              <select id="role" name="role" className="select">
                <option value="client">client</option>
                <option value="courier">courier</option>
                <option value="partner">partner</option>
                <option value="admin">admin</option>
                <option value="support">support</option>
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="status">РЎС‚Р°С‚СѓСЃ</label>
              <select id="status" name="status" className="select">
                <option value="active">active</option>
                <option value="blocked">blocked</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="button" type="submit">
              РЎРѕР·РґР°С‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
            </button>
            <button className="button ghost" type="button" onClick={() => setOpen(false)}>
              РћС‚РјРµРЅР°
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function UpdateUserModal({ onUpdate }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button" type="button" onClick={() => setOpen(true)}>
        РћР±РЅРѕРІРёС‚СЊ
      </button>
      <Modal open={open} title="РћР±РЅРѕРІРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ" onClose={() => setOpen(false)}>
        <form
          className="form-grid"
          action={onUpdate}
          onSubmit={() => setOpen(false)}
        >
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="updateUserId">ID РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ</label>
              <input id="updateUserId" name="id" className="input" placeholder="1" />
            </div>
            <div className="auth-field">
              <label htmlFor="updateUserName">Username</label>
              <input id="updateUserName" name="username" className="input" placeholder="@username" />
            </div>
          </div>
          <div className="form-row two">
            <div className="auth-field">
              <label htmlFor="updateUserRole">Р РѕР»СЊ</label>
              <select id="updateUserRole" name="role" className="select">
                <option value="">РќРµ РјРµРЅСЏС‚СЊ</option>
                <option value="client">client</option>
                <option value="courier">courier</option>
                <option value="partner">partner</option>
                <option value="admin">admin</option>
                <option value="support">support</option>
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="updateUserStatus">РЎС‚Р°С‚СѓСЃ</label>
              <select id="updateUserStatus" name="status" className="select">
                <option value="">РќРµ РјРµРЅСЏС‚СЊ</option>
                <option value="active">active</option>
                <option value="blocked">blocked</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="button" type="submit">
              РћР±РЅРѕРІРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
            </button>
            <button className="button ghost" type="button" onClick={() => setOpen(false)}>
              РћС‚РјРµРЅР°
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteUserModal({ onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button danger" type="button" onClick={() => setOpen(true)}>
        РЈРґР°Р»РёС‚СЊ
      </button>
      <Modal open={open} title="РЈРґР°Р»РёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ" onClose={() => setOpen(false)}>
        <form
          className="form-grid"
          action={onDelete}
          onSubmit={() => setOpen(false)}
        >
          <div className="form-row">
            <div className="auth-field">
              <label htmlFor="deleteUserId">ID РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ</label>
              <input id="deleteUserId" name="id" className="input" placeholder="1" />
            </div>
          </div>
          <div className="helper-text">Р”РµР№СЃС‚РІРёРµ РЅРµРѕР±СЂР°С‚РёРјРѕ.</div>
          <div className="modal-actions">
            <button className="button danger" type="submit">
              РЈРґР°Р»РёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
            </button>
            <button className="button ghost" type="button" onClick={() => setOpen(false)}>
              РћС‚РјРµРЅР°
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

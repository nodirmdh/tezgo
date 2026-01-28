import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const roleToPath = {
  client: "/client",
  partner: "/restaurant",
  courier: "/courier"
};

export default function ChangePasswordPage({ role }) {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await changePassword({ oldPassword, newPassword });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const basePath = roleToPath[role] || "/";
    navigate(basePath, { replace: true });
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-title">Change password</div>
        <div className="auth-subtitle">Update your credentials</div>
        <label className="auth-label" htmlFor="oldPassword">
          Current password
        </label>
        <input
          id="oldPassword"
          className="auth-input"
          type="password"
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
          required
        />
        <label className="auth-label" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          className="auth-input"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="action-row">
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button className="ghost" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </form>
    </div>
  );
}

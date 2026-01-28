import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const roleToPath = {
  client: "/client",
  partner: "/restaurant",
  courier: "/courier"
};

export default function LoginPage({ role }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login({ identifier: identifier.trim(), password });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const basePath = roleToPath[role] || "/";
    const needsChange = Boolean(result.data?.mustChangePassword);
    navigate(needsChange ? `${basePath}/change-password` : basePath, { replace: true });
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-title">Welcome back</div>
        <div className="auth-subtitle">
          Sign in to continue as {role}.
        </div>
        <label className="auth-label" htmlFor="identifier">
          Username or phone
        </label>
        <input
          id="identifier"
          className="auth-input"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="support_1"
          required
        />
        <label className="auth-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="auth-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? <div className="auth-error">{error}</div> : null}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {role === "client" ? (
          <div className="auth-footer">
            New here? <Link to="/client/register">Create account</Link>
          </div>
        ) : null}
      </form>
    </div>
  );
}

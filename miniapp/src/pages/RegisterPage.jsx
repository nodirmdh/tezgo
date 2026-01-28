import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await register({
      phone: phone.trim(),
      password,
      fullName: fullName.trim() || undefined
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/client", { replace: true });
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-title">Create account</div>
        <div className="auth-subtitle">Client registration</div>
        <label className="auth-label" htmlFor="fullName">
          Full name (optional)
        </label>
        <input
          id="fullName"
          className="auth-input"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Alex Smith"
        />
        <label className="auth-label" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          className="auth-input"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+998901234567"
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
          {loading ? "Creating..." : "Create account"}
        </button>
        <div className="auth-footer">
          Already have an account? <Link to="/client/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}

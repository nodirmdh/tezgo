import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "../../auth/api";

export default function ClientPointsPage() {
  const [points, setPoints] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPoints = async (query = "") => {
    setLoading(true);
    const params = new URLSearchParams({});
    if (query) params.set("q", query);
    const result = await apiJson(`/client/points?${params.toString()}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setPoints(result.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPoints();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadPoints(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => points, [points]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Client mini app</p>
          <h2>Каталог точек</h2>
        </div>
      </div>
      <div className="panel">
        <div className="form-row">
          <div className="auth-field">
            <label className="auth-label">Поиск</label>
            <input
              className="auth-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Название точки"
            />
          </div>
        </div>
        {error ? <div className="auth-error">{error}</div> : null}
        {loading ? (
          <div className="muted">Загрузка...</div>
        ) : (
          <div className="list-grid">
            {filtered.map((point) => (
              <Link key={point.id} to={`/client/points/${point.id}`} className="card">
                <div className="card-title">{point.name}</div>
                <div className="muted">{point.address}</div>
                <div className={point.status === "active" ? "pill success" : "pill danger"}>
                  {point.status === "active" ? "Открыто" : "Закрыто"}
                </div>
              </Link>
            ))}
            {!filtered.length ? (
              <div className="muted">Точек пока нет.</div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

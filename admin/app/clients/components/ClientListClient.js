"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";


const sortOptions = [
  { value: "name:asc", label: "РРјСЏ Aв†’Z" },
  { value: "name:desc", label: "РРјСЏ Zв†’A" },
  { value: "phone:asc", label: "РўРµР»РµС„РѕРЅ" },
  { value: "ordersCount:desc", label: "Р—Р°РєР°Р·РѕРІ" },
  { value: "status:asc", label: "РЎС‚Р°С‚СѓСЃ" },
  { value: "lastOrderAt:desc", label: "РџРѕСЃР»РµРґРЅРёР№ Р·Р°РєР°Р·" }
];

export default function ClientListClient() {
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState(sortOptions[0].value);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, dialog } = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))),
    [data.total, data.limit]
  );

  const fetchClients = async (searchValue) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      search: searchValue || "",
      status,
      page: String(page),
      limit: String(data.limit || 10),
      sort
    }).toString();
    const result = await apiJson(`/api/clients?${params}`);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, status, sort, page]);

  const handleBlockToggle = async (client) => {
    const nextStatus = client.status === "active" ? "blocked" : "active";
    confirm({
      title: nextStatus === "blocked" ? "Р—Р°Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ РєР»РёРµРЅС‚Р°?" : "Р Р°Р·Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ РєР»РёРµРЅС‚Р°?",
      description: "Р’С‹ СѓРІРµСЂРµРЅС‹, С‡С‚Рѕ С…РѕС‚РёС‚Рµ РёР·РјРµРЅРёС‚СЊ СЃС‚Р°С‚СѓСЃ РєР»РёРµРЅС‚Р°?",
      onConfirm: async () => {
        const result = await apiJson(`/api/clients/${client.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        if (!result.ok) {
          setToast({ type: "error", message: result.error });
          return;
        }
        setToast({ type: "success", message: "РЎС‚Р°С‚СѓСЃ РѕР±РЅРѕРІР»РµРЅ" });
        fetchClients(query);
      }
    });
  };

  const handleEdit = async (client) => {
    const name = window.prompt("РРјСЏ РєР»РёРµРЅС‚Р°", client.name || "");
    if (name === null) {
      return;
    }
    const phone = window.prompt("РўРµР»РµС„РѕРЅ", client.phone || "");
    if (phone === null) {
      return;
    }
    const result = await apiJson(`/api/clients/${client.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, phone })
    });
    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Р”Р°РЅРЅС‹Рµ РѕР±РЅРѕРІР»РµРЅС‹" });
    fetchClients(query);
  };

  return (
    <section>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="toolbar">
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder="РџРѕРёСЃРє РїРѕ РёРјРµРЅРё РёР»Рё С‚РµР»РµС„РѕРЅСѓ"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          <select
            className="select"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Р’СЃРµ СЃС‚Р°С‚СѓСЃС‹</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
          </select>
          <select
            className="select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      {loading ? (
        <div className="form-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-row" />
          ))}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>РљР»РёРµРЅС‚</th>
              <th>РўРµР»РµС„РѕРЅ</th>
              <th>Р—Р°РєР°Р·РѕРІ</th>
              <th>РЎС‚Р°С‚СѓСЃ</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((client) => (
              <tr key={client.id}>
                <td>{client.name || "-"}</td>
                <td>{client.phone || "-"}</td>
                <td>{client.orders_count}</td>
                <td>
                  <span className="badge">{client.status}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/clients/${client.id}`}>
                      View
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleEdit(client)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleBlockToggle(client)}
                    >
                      {client.status === "active" ? "Block" : "Unblock"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <button
          className="button"
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(Math.max(1, page - 1))}
        >
          РќР°Р·Р°Рґ
        </button>
        <div className="helper-text">
          РЎС‚СЂР°РЅРёС†Р° {page} РёР· {totalPages}
        </div>
        <button
          className="button"
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
        >
          Р’РїРµСЂРµРґ
        </button>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";
import { translateStatus } from "../../../lib/i18n";
import { useLocale } from "../../components/LocaleProvider";

const sortOptions = [
  { value: "name:asc", labelKey: "clients.sort.nameAsc" },
  { value: "name:desc", labelKey: "clients.sort.nameDesc" },
  { value: "phone:asc", labelKey: "clients.sort.phone" },
  { value: "ordersCount:desc", labelKey: "clients.sort.orders" },
  { value: "status:asc", labelKey: "clients.sort.status" },
  { value: "lastOrderAt:desc", labelKey: "clients.sort.lastOrder" }
];

export default function ClientListClient() {
  const { locale, t } = useLocale();
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
      title:
        nextStatus === "blocked"
          ? t("clients.confirm.blockTitle")
          : t("clients.confirm.unblockTitle"),
      description: t("clients.confirm.description"),
      onConfirm: async () => {
        const result = await apiJson(`/api/clients/${client.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("clients.toasts.statusUpdated") });
        fetchClients(query);
      }
    });
  };

  const handleEdit = async (client) => {
    const name = window.prompt(t("clients.prompts.name"), client.name || "");
    if (name === null) {
      return;
    }
    const phone = window.prompt(t("clients.prompts.phone"), client.phone || "");
    if (phone === null) {
      return;
    }
    const result = await apiJson(`/api/clients/${client.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, phone })
    });
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setToast({ type: "success", message: t("clients.toasts.updated") });
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
            placeholder={t("clients.searchPlaceholder")}
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
            <option value="">{t("clients.allStatuses")}</option>
            {["active", "blocked"].map((item) => (
              <option key={item} value={item}>
                {translateStatus(locale, item)}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <div className="banner error">{t(error)}</div> : null}
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
              <th>{t("clients.table.client")}</th>
              <th>{t("clients.table.phone")}</th>
              <th>{t("clients.table.orders")}</th>
              <th>{t("clients.table.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((client) => (
              <tr key={client.id}>
                <td>{client.name || "-"}</td>
                <td>{client.phone || "-"}</td>
                <td>{client.orders_count}</td>
                <td>
                  <span className="badge">{translateStatus(locale, client.status)}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link className="action-link" href={`/clients/${client.id}`}>
                      {t("common.view")}
                    </Link>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleEdit(client)}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      className="action-link"
                      type="button"
                      onClick={() => handleBlockToggle(client)}
                    >
                      {client.status === "active"
                        ? t("clients.actions.block")
                        : t("clients.actions.unblock")}
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
          {t("common.back")}
        </button>
        <div className="helper-text">
          {t("common.page", { page, total: totalPages })}
        </div>
        <button
          className="button"
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
        >
          {t("common.next")}
        </button>
      </div>
    </section>
  );
}

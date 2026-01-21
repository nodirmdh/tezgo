"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { searchAll } from "../../lib/api/search";

const highlightText = (text, query) => {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index}>{part}</mark>
    ) : (
      part
    )
  );
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ users: [], clients: [], orders: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const containerRef = useRef(null);

  const items = useMemo(() => {
    const list = [];
    results.users.forEach((item) =>
      list.push({ type: "users", label: item.username || item.tgId, item })
    );
    results.clients.forEach((item) =>
      list.push({ type: "clients", label: item.name || item.phone, item })
    );
    results.orders.forEach((item) =>
      list.push({ type: "orders", label: item.orderId, item })
    );
    return list;
  }, [results]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], clients: [], orders: [] });
      setOpen(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      const data = await searchAll(query.trim(), controller.signal);
      setResults(data);
      setLoading(false);
      setOpen(true);
      setActiveIndex(-1);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!open) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
      if (event.key === "Enter" && activeIndex >= 0) {
        const target = items[activeIndex];
        if (target) {
          window.location.href = getHref(target);
          setOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, items, activeIndex]);

  useEffect(() => {
    const handler = (event) => {
      if (containerRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const hasResults =
    results.users.length || results.clients.length || results.orders.length;

  const getHref = (target) => {
    if (target.type === "users") return `/users/${target.item.id}`;
    if (target.type === "clients") return `/clients/${target.item.id}`;
    return `/orders/${target.item.id}`;
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      setOpen(true);
    }
  };

  return (
    <div
      className="global-search"
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      }}
    >
      <input
        className="input"
        placeholder="Search user, client, phone, order…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => query && setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open ? (
        <div className="search-dropdown">
          {loading ? <div className="search-loading">Loading…</div> : null}
          {!loading && !hasResults ? (
            <div className="search-empty">No results found</div>
          ) : null}
          {!loading && results.users.length ? (
            <div className="search-group">
              <div className="search-group-title">USERS</div>
              {results.users.map((item, index) => (
                <Link
                  key={`user-${item.id}`}
                  className={`search-item ${activeIndex === index ? "active" : ""}`}
                  href={`/users/${item.id}`}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="search-main">
                    {highlightText(item.username || item.tgId, query)}
                  </div>
                  <div className="search-meta">
                    {item.tgId} · {item.role}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
          {!loading && results.clients.length ? (
            <div className="search-group">
              <div className="search-group-title">CLIENTS</div>
              {results.clients.map((item, index) => {
                const offset = results.users.length;
                const currentIndex = offset + index;
                return (
                  <Link
                    key={`client-${item.id}`}
                    className={`search-item ${activeIndex === currentIndex ? "active" : ""}`}
                    href={`/clients/${item.id}`}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                  >
                    <div className="search-main">
                      {highlightText(item.name || item.phone, query)}
                    </div>
                    <div className="search-meta">{item.phone}</div>
                  </Link>
                );
              })}
            </div>
          ) : null}
          {!loading && results.orders.length ? (
            <div className="search-group">
              <div className="search-group-title">ORDERS</div>
              {results.orders.map((item, index) => {
                const offset = results.users.length + results.clients.length;
                const currentIndex = offset + index;
                return (
                  <Link
                    key={`order-${item.id}`}
                    className={`search-item ${activeIndex === currentIndex ? "active" : ""}`}
                    href={`/orders/${item.id}`}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                  >
                    <div className="search-main">
                      {highlightText(item.orderId, query)}
                    </div>
                    <div className="search-meta">
                      {item.amount ? `${item.amount} сум` : "-"} · {item.status}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

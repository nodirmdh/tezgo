"use client";

import { useEffect, useState } from "react";

const normalizeRole = (role) => String(role || "support").toLowerCase();

export default function RoleGate({ allow = ["admin"], children }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      setAllowed(false);
      return;
    }
    const role = normalizeRole(JSON.parse(stored).role);
    setAllowed(allow.map(normalizeRole).includes(role));
  }, [allow]);

  if (!allowed) {
    return null;
  }

  return children;
}

"use client";

import { useMemo } from "react";
import { useAuth } from "./AuthProvider";

const normalizeRole = (role) => String(role || "support").toLowerCase();

export default function RoleGate({ allow = ["admin"], children }) {
  const { user } = useAuth();
  const allowed = useMemo(() => {
    const role = normalizeRole(user?.role);
    return allow.map(normalizeRole).includes(role);
  }, [allow, user]);

  if (!allowed) {
    return null;
  }

  return children;
}

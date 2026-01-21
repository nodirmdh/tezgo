const roleMatrix = {
  admin: ["*"],
  support: ["view", "note"],
  operator: ["view", "note", "block", "edit"],
  "read-only": ["view"]
};

export const normalizeRole = (role) =>
  String(role || "support").toLowerCase();

export const can = (action, role) => {
  const normalized = normalizeRole(role);
  const permissions = roleMatrix[normalized] || [];
  if (permissions.includes("*")) {
    return true;
  }
  return permissions.includes(action);
};

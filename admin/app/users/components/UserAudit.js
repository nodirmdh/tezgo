"use client";

import AuditLogTable from "../../components/AuditLogTable";

export default function UserAudit({ data, loading, error }) {
  return <AuditLogTable data={data} loading={loading} error={error} />;
}

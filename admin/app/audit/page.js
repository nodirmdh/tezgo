import PageHeader from "../components/PageHeader";
import AuditListClient from "./AuditListClient";

export default function AuditPage() {
  return (
    <main>
      <PageHeader title="Audit" description="Change history across entities." />
      <AuditListClient />
    </main>
  );
}
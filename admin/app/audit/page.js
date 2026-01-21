import PageHeader from "../components/PageHeader";
import AuditListClient from "./AuditListClient";

export default function AuditPage() {
  return (
    <main>
      <PageHeader
        titleKey="pages.audit.title"
        descriptionKey="pages.audit.description"
      />
      <AuditListClient />
    </main>
  );
}

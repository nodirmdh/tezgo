import PageHeader from "../components/PageHeader";
import ClientListClient from "./components/ClientListClient";

export default function ClientsPage() {
  return (
    <main>
      <PageHeader
        titleKey="pages.clients.title"
        descriptionKey="pages.clients.description"
      />
      <ClientListClient />
    </main>
  );
}

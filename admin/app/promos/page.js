import PageHeader from "../components/PageHeader";
import PromoListClient from "./components/PromoListClient";

export default function PromosPage() {
  return (
    <main>
      <PageHeader
        titleKey="pages.promos.title"
        descriptionKey="pages.promos.description"
      />
      <PromoListClient />
    </main>
  );
}

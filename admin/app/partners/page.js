import PageHeader from "../components/PageHeader";
import PartnerListClient from "./components/PartnerListClient";

export default function PartnersPage() {
  return (
    <main>
      <PageHeader
        titleKey="pages.partners.title"
        descriptionKey="pages.partners.description"
      />
      <PartnerListClient />
    </main>
  );
}

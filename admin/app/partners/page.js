import PageHeader from "../components/PageHeader";
import PartnerListClient from "./components/PartnerListClient";

export default function PartnersPage() {
  return (
    <main>
      <PageHeader title="Partners" description="Partners and outlets overview." />
      <PartnerListClient />
    </main>
  );
}
import PageHeader from "../../components/PageHeader";
import PartnerPayoutReportClient from "./components/PartnerPayoutReportClient";

export default function PartnerPayoutReportPage() {
  return (
    <main>
      <PageHeader
        titleKey="partners.payouts.title"
        descriptionKey="partners.payouts.description"
      />
      <PartnerPayoutReportClient />
    </main>
  );
}

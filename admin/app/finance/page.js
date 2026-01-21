import PageHeader from "../components/PageHeader";
import FinanceDashboardClient from "./components/FinanceDashboardClient";

export default function FinancePage() {
  return (
    <main>
      <PageHeader
        titleKey="pages.finance.title"
        descriptionKey="pages.finance.description"
      />
      <FinanceDashboardClient />
    </main>
  );
}

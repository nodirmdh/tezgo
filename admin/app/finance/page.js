import PageHeader from "../components/PageHeader";
import FinanceDashboardClient from "./components/FinanceDashboardClient";

export default function FinancePage() {
  return (
    <main>
      <PageHeader title="Finance" description="Read-only financial overview." />
      <FinanceDashboardClient />
    </main>
  );
}
import PageHeader from "../components/PageHeader";
import DashboardClient from "./components/DashboardClient";

export default function DashboardPage() {
  return (
    <main>
      <PageHeader title="Dashboard" description="Operational overview." />
      <DashboardClient />
    </main>
  );
}
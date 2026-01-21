import PageHeader from "../components/PageHeader";
import DashboardClient from "./components/DashboardClient";

export default function DashboardPage() {
  return (
    <main>
      <PageHeader
        titleKey="dashboard.title"
        descriptionKey="dashboard.description"
      />
      <DashboardClient />
    </main>
  );
}

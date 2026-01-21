import PageHeader from "../components/PageHeader";
import OutletListClient from "./components/OutletListClient";

export default function OutletsPage() {
  return (
    <main>
      <PageHeader title="Outlets" description="Outlets and their status." />
      <OutletListClient />
    </main>
  );
}
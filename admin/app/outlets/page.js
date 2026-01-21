import PageHeader from "../components/PageHeader";
import OutletListClient from "./components/OutletListClient";

export default function OutletsPage() {
  return (
    <main>
      <PageHeader
        titleKey="pages.outlets.title"
        descriptionKey="pages.outlets.description"
      />
      <OutletListClient />
    </main>
  );
}

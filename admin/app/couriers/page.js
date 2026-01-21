import PageHeader from "../components/PageHeader";
import CourierListClient from "./components/CourierListClient";

export default function CouriersPage() {
  return (
    <main>
      <PageHeader
        titleKey="pages.couriers.title"
        descriptionKey="pages.couriers.description"
      />
      <CourierListClient />
    </main>
  );
}

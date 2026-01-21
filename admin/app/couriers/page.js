import PageHeader from "../components/PageHeader";
import CourierListClient from "./components/CourierListClient";

export default function CouriersPage() {
  return (
    <main>
      <PageHeader title="Couriers" description="Courier list and delivery status." />
      <CourierListClient />
    </main>
  );
}
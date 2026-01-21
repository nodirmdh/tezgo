import PageHeader from "../components/PageHeader";
import PromoListClient from "./components/PromoListClient";

export default function PromosPage() {
  return (
    <main>
      <PageHeader title="Promos" description="Promos and usage overview." />
      <PromoListClient />
    </main>
  );
}
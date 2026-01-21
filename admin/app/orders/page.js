import PageHeader from "../components/PageHeader";
import OrderListClient from "./components/OrderListClient";

export default function OrdersPage() {
  return (
    <main>
      <PageHeader
        titleKey="pages.orders.title"
        descriptionKey="pages.orders.description"
      />
      <OrderListClient />
    </main>
  );
}

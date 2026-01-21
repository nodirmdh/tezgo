import PageHeader from "../components/PageHeader";
import OrderListClient from "./components/OrderListClient";

export default function OrdersPage() {
  return (
    <main>
      <PageHeader title="Orders" description="Поиск и управление заказами." />
      <OrderListClient />
    </main>
  );
}

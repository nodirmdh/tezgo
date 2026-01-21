import PageHeader from "../../components/PageHeader";
import OrderProfileClient from "../components/OrderProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";

export default async function OrderProfilePage({ params }) {
  const response = await apiRequest(`/api/orders/${params.id}/details`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          title="Order profile"
          description="???????? ????????? ?????? ? ???????? ?????????."
        />
        <div className="banner error">{apiErrorMessage(response.status)}</div>
      </main>
    );
  }
  const order = await response.json();

  return (
    <main>
      <OrderProfileClient orderId={params.id} initialOrder={order} />
    </main>
  );
}

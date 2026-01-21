import PageHeader from "../../components/PageHeader";
import OrderProfileClient from "../components/OrderProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";
import { getServerLocale } from "../../../lib/i18n.server";
import { t } from "../../../lib/i18n";

export default async function OrderProfilePage({ params }) {
  const locale = getServerLocale();
  const response = await apiRequest(`/api/orders/${params.id}/details`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          titleKey="orders.profile.title"
          descriptionKey="orders.profile.description"
        />
        <div className="banner error">{t(locale, apiErrorMessage(response.status))}</div>
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

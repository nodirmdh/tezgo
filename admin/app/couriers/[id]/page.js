import PageHeader from "../../components/PageHeader";
import CourierProfileClient from "../components/CourierProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";
import { getServerLocale } from "../../../lib/i18n.server";
import { t } from "../../../lib/i18n";

export default async function CourierProfilePage({ params }) {
  const locale = getServerLocale();
  const response = await apiRequest(`/api/couriers/${params.id}`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          titleKey="couriers.profile.title"
          descriptionKey="couriers.profile.description"
        />
        <div className="banner error">{t(locale, apiErrorMessage(response.status))}</div>
      </main>
    );
  }
  const courier = await response.json();

  return (
    <main>
      <CourierProfileClient courierId={params.id} initialCourier={courier} />
    </main>
  );
}

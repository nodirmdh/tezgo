import PageHeader from "../../components/PageHeader";
import OutletProfileClient from "../components/OutletProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";
import { getServerLocale } from "../../../lib/i18n.server";
import { t } from "../../../lib/i18n";

export default async function OutletProfilePage({ params }) {
  const locale = getServerLocale();
  const response = await apiRequest(`/api/outlets/${params.id}`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          titleKey="outlets.profile.title"
          descriptionKey="outlets.profile.description"
        />
        <div className="banner error">{t(locale, apiErrorMessage(response.status))}</div>
      </main>
    );
  }
  const outlet = await response.json();

  return (
    <main>
      <OutletProfileClient outletId={params.id} initialOutlet={outlet} />
    </main>
  );
}

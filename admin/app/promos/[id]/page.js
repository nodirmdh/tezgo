import PageHeader from "../../components/PageHeader";
import PromoProfileClient from "../components/PromoProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";
import { getServerLocale } from "../../../lib/i18n.server";
import { t } from "../../../lib/i18n";

export default async function PromoProfilePage({ params }) {
  const locale = getServerLocale();
  const response = await apiRequest(`/api/promos/${params.id}`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          titleKey="promos.profile.title"
          descriptionKey="promos.profile.description"
        />
        <div className="banner error">{t(locale, apiErrorMessage(response.status))}</div>
      </main>
    );
  }
  const promo = await response.json();

  return (
    <main>
      <PromoProfileClient promoId={params.id} initialPromo={promo} />
    </main>
  );
}

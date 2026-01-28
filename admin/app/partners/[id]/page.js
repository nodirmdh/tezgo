import PageHeader from "../../components/PageHeader";
import PartnerProfileClient from "../components/PartnerProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";
import { getServerLocale } from "../../../lib/i18n.server";
import { t } from "../../../lib/i18n";

export default async function PartnerProfilePage({ params }) {
  const locale = getServerLocale();
  const response = await apiRequest(`/admin/partners/${params.id}`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          titleKey="partners.profile.title"
          descriptionKey="partners.profile.description"
        />
        <div className="banner error">{t(locale, apiErrorMessage(response.status))}</div>
      </main>
    );
  }
  const partner = await response.json();

  return (
    <main>
      <PartnerProfileClient partnerId={params.id} initialPartner={partner} />
    </main>
  );
}

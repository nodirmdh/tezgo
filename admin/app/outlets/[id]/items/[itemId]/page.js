import PageHeader from "../../../../components/PageHeader";
import ItemProfileClient from "../../../components/ItemProfileClient";
import { apiRequest } from "../../../../../lib/serverApi";
import { apiErrorMessage } from "../../../../../lib/api/errors";
import { getServerLocale } from "../../../../../lib/i18n.server";
import { t } from "../../../../../lib/i18n";

export default async function ItemProfilePage({ params }) {
  const locale = getServerLocale();
  const response = await apiRequest(
    `/api/outlets/${params.id}/items/${params.itemId}`
  );
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          titleKey="outlets.menu.profile.title"
          descriptionKey="outlets.menu.profile.description"
        />
        <div className="banner error">{t(locale, apiErrorMessage(response.status))}</div>
      </main>
    );
  }
  const item = await response.json();

  return (
    <main>
      <ItemProfileClient
        outletId={params.id}
        itemId={params.itemId}
        initialItem={item}
      />
    </main>
  );
}

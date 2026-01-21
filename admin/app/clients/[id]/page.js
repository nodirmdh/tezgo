import PageHeader from "../../components/PageHeader";
import ClientProfileClient from "../components/ClientProfileClient";
import { getClientProfile } from "../../../lib/clientProfileApi";
import { getServerLocale } from "../../../lib/i18n.server";
import { t } from "../../../lib/i18n";

const errorMessage = (locale, status) => {
  if (status === 401) return t(locale, "errors.authRequired");
  if (status === 403) return t(locale, "errors.forbidden");
  if (status === 404) return t(locale, "errors.notFoundClient");
  return t(locale, "errors.server");
};

export default async function ClientProfilePage({ params }) {
  const locale = getServerLocale();
  const { client, error } = await getClientProfile(params.id);

  if (error || !client) {
    return (
      <main>
        <PageHeader
          titleKey="clients.profile.title"
          descriptionKey="errors.loadProfile"
        />
        <div className="banner error">{errorMessage(locale, error || 500)}</div>
      </main>
    );
  }

  return (
    <main>
      <ClientProfileClient clientId={params.id} initialClient={client} />
    </main>
  );
}

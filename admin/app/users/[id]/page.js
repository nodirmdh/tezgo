import PageHeader from "../../components/PageHeader";
import UserProfileClient from "../components/UserProfileClient";
import { getUserProfile } from "../../../lib/userProfileApi";
import { getServerLocale } from "../../../lib/i18n.server";
import { t } from "../../../lib/i18n";

const errorMessage = (locale, status) => {
  if (status === 401) return t(locale, "errors.authRequired");
  if (status === 403) return t(locale, "errors.forbidden");
  if (status === 404) return t(locale, "errors.notFoundUser");
  return t(locale, "errors.server");
};

export default async function UserProfilePage({ params }) {
  const locale = getServerLocale();
  const { user, error } = await getUserProfile(params.id);

  if (error || !user) {
    return (
      <main>
        <PageHeader
          titleKey="users.profile.title"
          descriptionKey="errors.loadProfile"
        />
        <div className="banner error">{errorMessage(locale, error || 500)}</div>
      </main>
    );
  }

  return (
    <main>
      <UserProfileClient userId={params.id} initialUser={user} />
    </main>
  );
}

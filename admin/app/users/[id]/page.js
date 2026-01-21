import PageHeader from "../../components/PageHeader";
import UserProfileClient from "../components/UserProfileClient";
import { getUserProfile } from "../../../lib/userProfileApi";

const errorMessage = (status) => {
  if (status === 401) return "401: Требуется авторизация.";
  if (status === 403) return "403: Доступ запрещен.";
  if (status === 404) return "404: Пользователь не найден.";
  return "500: Ошибка сервера.";
};

export default async function UserProfilePage({ params }) {
  const { user, error } = await getUserProfile(params.id);

  if (error || !user) {
    return (
      <main>
        <PageHeader
          title="User profile"
          description="Не удалось загрузить данные профиля."
        />
        <div className="banner error">{errorMessage(error || 500)}</div>
      </main>
    );
  }

  return (
    <main>
      <UserProfileClient userId={params.id} initialUser={user} />
    </main>
  );
}

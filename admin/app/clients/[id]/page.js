import PageHeader from "../../components/PageHeader";
import ClientProfileClient from "../components/ClientProfileClient";
import { getClientProfile } from "../../../lib/clientProfileApi";

const errorMessage = (status) => {
  if (status === 401) return "401: Требуется авторизация.";
  if (status === 403) return "403: Доступ запрещен.";
  if (status === 404) return "404: Клиент не найден.";
  return "500: Ошибка сервера.";
};

export default async function ClientProfilePage({ params }) {
  const { client, error } = await getClientProfile(params.id);

  if (error || !client) {
    return (
      <main>
        <PageHeader
          title="Client profile"
          description="Не удалось загрузить данные профиля."
        />
        <div className="banner error">{errorMessage(error || 500)}</div>
      </main>
    );
  }

  return (
    <main>
      <ClientProfileClient clientId={params.id} initialClient={client} />
    </main>
  );
}

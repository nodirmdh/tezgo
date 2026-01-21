import PageHeader from "../../components/PageHeader";
import CourierProfileClient from "../components/CourierProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";

export default async function CourierProfilePage({ params }) {
  const response = await apiRequest(`/api/couriers/${params.id}`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          title="Courier profile"
          description="Check access and courier identifier."
        />
        <div className="banner error">{apiErrorMessage(response.status)}</div>
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
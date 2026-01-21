import PageHeader from "../../components/PageHeader";
import PromoProfileClient from "../components/PromoProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";

export default async function PromoProfilePage({ params }) {
  const response = await apiRequest(`/api/promos/${params.id}`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          title="Promo profile"
          description="Check access and promo identifier."
        />
        <div className="banner error">{apiErrorMessage(response.status)}</div>
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
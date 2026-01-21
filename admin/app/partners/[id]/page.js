import PageHeader from "../../components/PageHeader";
import PartnerProfileClient from "../components/PartnerProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";

export default async function PartnerProfilePage({ params }) {
  const response = await apiRequest(`/api/partners/${params.id}`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          title="Partner profile"
          description="Check access and partner identifier."
        />
        <div className="banner error">{apiErrorMessage(response.status)}</div>
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
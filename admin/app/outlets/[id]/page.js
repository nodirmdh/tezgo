import PageHeader from "../../components/PageHeader";
import OutletProfileClient from "../components/OutletProfileClient";
import { apiRequest } from "../../../lib/serverApi";
import { apiErrorMessage } from "../../../lib/api/errors";

export default async function OutletProfilePage({ params }) {
  const response = await apiRequest(`/api/outlets/${params.id}`);
  if (!response.ok) {
    return (
      <main>
        <PageHeader
          title="Outlet profile"
          description="Check access and outlet identifier."
        />
        <div className="banner error">{apiErrorMessage(response.status)}</div>
      </main>
    );
  }
  const outlet = await response.json();

  return (
    <main>
      <OutletProfileClient outletId={params.id} initialOutlet={outlet} />
    </main>
  );
}
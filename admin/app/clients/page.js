import PageHeader from "../components/PageHeader";
import ClientListClient from "./components/ClientListClient";

export default function ClientsPage() {
  return (
    <main>
      <PageHeader title="Clients" description="Р‘С‹СЃС‚СЂС‹Р№ РїРѕРёСЃРє Рё СѓРїСЂР°РІР»РµРЅРёРµ РєР»РёРµРЅС‚Р°РјРё." />
      <ClientListClient />
    </main>
  );
}

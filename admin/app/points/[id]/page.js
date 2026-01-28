import PageHeader from "../../components/PageHeader";
import PointMenuClient from "../components/PointMenuClient";

export default function PointMenuPage({ params }) {
  return (
    <main>
      <PageHeader titleKey="points.menu.header" descriptionKey="points.menu.description" />
      <PointMenuClient pointId={params.id} />
    </main>
  );
}

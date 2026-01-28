import PageHeader from "../components/PageHeader";
import PointListClient from "./components/PointListClient";

export default function PointsPage() {
  return (
    <main>
      <PageHeader titleKey="pages.points.title" descriptionKey="pages.points.description" />
      <PointListClient />
    </main>
  );
}

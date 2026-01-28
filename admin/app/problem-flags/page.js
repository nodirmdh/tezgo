import PageHeader from "../components/PageHeader";
import ProblemFlagsClient from "./components/ProblemFlagsClient";

export default function ProblemFlagsPage() {
  return (
    <main>
      <PageHeader
        titleKey="flags.title"
        descriptionKey="flags.description"
      />
      <ProblemFlagsClient />
    </main>
  );
}

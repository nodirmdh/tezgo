import PageHeader from "../../components/PageHeader";
import CourierLeaderboardClient from "./components/CourierLeaderboardClient";

export default function CourierLeaderboardPage() {
  return (
    <main>
      <PageHeader
        titleKey="couriers.leaderboard.title"
        descriptionKey="couriers.leaderboard.description"
      />
      <CourierLeaderboardClient />
    </main>
  );
}

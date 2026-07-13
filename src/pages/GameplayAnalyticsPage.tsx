import GameplayAnalytics from "../components/analytics/GameplayAnalytics";
import AnalyticsTypeSelector from "../components/analytics/AnalyticsTypeSelector";
import { Header } from "../components/header/Header";

export { GameplayAnalyticsTabs } from "../components/analytics/GameplayAnalytics";

export default function GameplayAnalyticsPage() {
  return (
    <>
      <Header showLocationSelector={false} />
      <AnalyticsTypeSelector />
      <GameplayAnalytics />
    </>
  );
}

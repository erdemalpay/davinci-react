import AccountingAnalytics from "../components/analytics/AccountingAnalytics";
import AnalyticsTypeSelector from "../components/analytics/AnalyticsTypeSelector";
import { Header } from "../components/header/Header";

export { AccountingAnalyticsTabs } from "../components/analytics/AccountingAnalytics";

export default function AccountingAnalyticsPage() {
  return (
    <>
      <Header showLocationSelector={false} />
      <AnalyticsTypeSelector />
      <AccountingAnalytics />
    </>
  );
}

import { AiOutlineFileText } from "react-icons/ai";
import { LuGitCompare } from "react-icons/lu";
import { Header } from "../components/header/Header";
import PriceCompareLogs from "../components/logs/PriceCompareLogs";
import WebhookLogs from "../components/logs/WebhookLogs";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { LogsPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const LogsPageTabs = [
  {
    number: LogsPageTabEnum.WEBHOOK_LOGS,
    label: "Webhook Logs",
    icon: <AiOutlineFileText className="text-lg font-thin" />,
    content: <WebhookLogs />,
    isDisabled: false,
  },
  {
    number: LogsPageTabEnum.PRICE_COMPARE_LOGS,
    label: "Price Compare Logs",
    icon: <LuGitCompare className="text-lg font-thin" />,
    content: <PriceCompareLogs />,
    isDisabled: false,
  },
];

export default function Logs() {
  const { setCurrentPage, setSearchQuery, logsActiveTab, setLogsActiveTab } =
    useGeneralContext();
  const currentPageId = "logs";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();

  if (!user || pages.length === 0) return <></>;

  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;

  const tabs = LogsPageTabs.map((tab) => {
    return {
      ...tab,
      isDisabled: currentPageTabs
        ?.find((item) => item.name === tab.label)
        ?.permissionRoles?.includes(user.role._id)
        ? false
        : true,
    };
  });

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={logsActiveTab}
          setActiveTab={setLogsActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}

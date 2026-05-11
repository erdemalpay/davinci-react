import { useState } from "react";
import { MdOutlinePriceChange } from "react-icons/md";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import LocalPriceComparision from "../components/stocks/LocalPriceComparision";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

const ComparisionPageTabs = [
  {
    number: 0,
    label: "Local Price Comparison",
    icon: <MdOutlinePriceChange className="text-lg font-thin" />,
    content: <LocalPriceComparision />,
    isDisabled: false,
  },
];

export default function Comparision() {
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const [comparisionActiveTab, setComparisionActiveTab] = useState<number>(0);
  const currentPageId = "comparision";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();

  if (!user || pages.length === 0) return <></>;

  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;

  const tabs = ComparisionPageTabs.map((tab) => {
    const foundTab = currentPageTabs?.find((item) => item.name === tab.label);
    return {
      ...tab,
      isDisabled: foundTab
        ? !foundTab.permissionRoles?.includes(user.role._id)
        : false,
    };
  });

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={comparisionActiveTab}
          setActiveTab={setComparisionActiveTab}
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

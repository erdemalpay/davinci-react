import { useState } from "react";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { RiBarChartFill } from "react-icons/ri";
import UnifiedTabPanel from "../../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountingAnalyticsTabEnum } from "../../types";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import MenuItemPriceChart from "./accounting/MenuItemPriceChart";
import ProductPriceChart from "./accounting/ProductPriceChart";

export const AccountingAnalyticsTabs = [
  {
    number: AccountingAnalyticsTabEnum.PRODUCTPRICECHART,
    label: "Product Price Chart",
    icon: <RiBarChartFill className="text-lg font-thin" />,
    content: <ProductPriceChart />,
    isDisabled: false,
  },
  {
    number: AccountingAnalyticsTabEnum.MENUITEMPRICECHART,
    label: "Menu Item Price Chart",
    icon: <MdOutlineRestaurantMenu className="text-lg font-thin" />,
    content: <MenuItemPriceChart />,
    isDisabled: false,
  },
];

export default function AccountingAnalytics() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const currentPageId = "accounting_analytics";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || (pages && pages?.length === 0)) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = AccountingAnalyticsTabs.map((tab) => {
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
      <UnifiedTabPanel
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
        allowOrientationToggle={true}
      />
    </>
  );
}

import { useState } from "react";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { RiBarChartFill } from "react-icons/ri";
import UnifiedTabPanel from "../../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../../context/General.context";
import { AccountingAnalyticsTabEnum } from "../../types";
import MenuItemPriceChart from "./accounting/MenuItemPriceChart";
import ProductPriceChart from "./accounting/ProductPriceChart";

export default function AccountingAnalytics() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const tabs = [
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
  return (
    <>
      <UnifiedTabPanel
        tabs={tabs?.map((tab) => ({
          ...tab,
          number: tab.number - tabs?.filter((t) => t?.isDisabled)?.length,
        }))}
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

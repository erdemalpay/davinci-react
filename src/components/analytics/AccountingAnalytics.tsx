import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { RiBarChartFill } from "react-icons/ri";
import { useGeneralContext } from "../../context/General.context";
import TabPanel from "../panelComponents/TabPanel/TabPanel";
import MenuItemPriceChart from "./accounting/MenuItemPriceChart";
import ProductPriceChart from "./accounting/ProductPriceChart";

export default function AccountingAnalytics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const tabs = [
    {
      number: 0,
      label: t("Product Price Chart"),
      icon: <RiBarChartFill className="text-lg font-thin" />,
      content: <ProductPriceChart />,
      isDisabled: false,
    },
    {
      number: 1,
      label: t("Menu Item Price Chart"),
      icon: <MdOutlineRestaurantMenu className="text-lg font-thin" />,
      content: <MenuItemPriceChart />,
      isDisabled: false,
    },
  ];
  return (
    <>
      <TabPanel
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
      />
    </>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { RiBarChartFill } from "react-icons/ri";
import TabPanel from "../panelComponents/TabPanel/TabPanel";
import MenuItemPriceChart from "./accounting/MenuItemPriceChart";
import ProductPriceChart from "./accounting/ProductPriceChart";

export default function AccountingAnalytics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);
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
      <TabPanel tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
}

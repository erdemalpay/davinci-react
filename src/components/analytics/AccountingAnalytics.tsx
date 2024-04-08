import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiBarChartFill } from "react-icons/ri";
import { useUserContext } from "../../context/User.context";
import { Role, RoleEnum } from "../../types";
import { Header } from "../header/Header";
import TabPanel from "../panelComponents/TabPanel/TabPanel";
import ProductPriceChart from "./accounting/ProductPriceChart";

export default function AccountingAnalytics() {
  const { user } = useUserContext();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [tabPanelKey, setTabPanelKey] = useState<number>(0);
  const tabs = [
    {
      number: 0,
      label: t("Product Price Chart"),
      icon: <RiBarChartFill className="text-lg font-thin" />,
      content: <ProductPriceChart />,
      isDisabled: user ? (user.role as Role)._id !== RoleEnum.MANAGER : true,
    },
  ];
  useEffect(() => {
    setTabPanelKey((prev) => prev + 1);
  }, [activeTab]);
  return (
    <>
      <Header showLocationSelector={false} />

      <TabPanel
        key={tabPanelKey}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
}

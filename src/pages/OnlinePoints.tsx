import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdHistory, MdOutlineDashboard, MdOutlinePeople } from "react-icons/md";
import { RiCoupon3Line } from "react-icons/ri";
import { Header } from "../components/header/Header";
import {
  LoyaltyAccounts,
  LoyaltyCoupons,
  LoyaltyTransactions,
} from "../components/loyalty/LoyaltyLists";
import LoyaltyOverview from "../components/loyalty/LoyaltyOverview";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";

// kutuoyunual.com loyalty points (separate from the cafe points page).
export default function OnlinePoints() {
  const { t } = useTranslation();
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      number: 0,
      label: t("Overview"),
      icon: <MdOutlineDashboard className="text-lg font-thin" />,
      content: <LoyaltyOverview />,
      isDisabled: false,
    },
    {
      number: 1,
      label: t("Customers"),
      icon: <MdOutlinePeople className="text-lg font-thin" />,
      content: <LoyaltyAccounts />,
      isDisabled: false,
    },
    {
      number: 2,
      label: t("Point History"),
      icon: <MdHistory className="text-lg font-thin" />,
      content: <LoyaltyTransactions />,
      isDisabled: false,
    },
    {
      number: 3,
      label: t("Coupons"),
      icon: <RiCoupon3Line className="text-lg font-thin" />,
      content: <LoyaltyCoupons />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5">
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
      </div>
    </>
  );
}

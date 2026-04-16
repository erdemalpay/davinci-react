import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineStorefront } from "react-icons/md";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import RetailerTab from "../components/stocks/Retailer";
import { useGeneralContext } from "../context/General.context";

export const RetailerPageTabs = [
  {
    number: 0,
    label: "Retailer",
    icon: <MdOutlineStorefront className="text-lg font-thin" />,
    content: <RetailerTab />,
    isDisabled: false,
  },
];

export default function Retailer() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();

  const tabs = useMemo(
    () =>
      RetailerPageTabs.map((tab) => ({
        ...tab,
        label: tab.label === "Retailer" ? t("Retailer") : tab.label,
      })),
    [t]
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
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

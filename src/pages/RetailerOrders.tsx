import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineChecklist, MdOutlineStorefront } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import RetailerItemSummaryTab from "../components/retailer/RetailerItemSummary";
import RetailerOrdersTab from "../components/retailer/RetailerOrders";
import { useGeneralContext } from "../context/General.context";
import { Routes } from "../navigation/constants";
import { AccountRetailer } from "../types";
import { useGetAccountRetailers } from "../utils/api/account/retailer";

export const RetailerOrdersPageTabs = [
  {
    number: 0,
    label: "Orders",
    icon: <MdOutlineStorefront className="text-lg font-thin" />,
    content: <RetailerOrdersTab />,
    isDisabled: false,
  },
  {
    number: 1,
    label: "Item Summary",
    icon: <MdOutlineChecklist className="text-lg font-thin" />,
    content: <RetailerItemSummaryTab />,
    isDisabled: false,
  },
];

export default function RetailerOrders() {
  const navigate = useNavigate();
  const { retailerId } = useParams();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedRetailer, setSelectedRetailer] = useState<AccountRetailer>();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const retailers = useGetAccountRetailers();

  const currentRetailer = retailers?.find(
    (retailer) => String(retailer._id) === retailerId
  );

  const pageNavigations = [
    {
      name: t("Retailer"),
      path: Routes.Retailer,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setCurrentPage(1);
        setSortConfigKey(null);
        setSearchQuery("");
      },
    },
    {
      name: t("Orders"),
      path: "",
      canBeClicked: false,
    },
  ];

  const retailerOptions = retailers?.map((retailer) => ({
    value: String(retailer._id),
    label: retailer.name,
  }));

  const tabs = useMemo(
    () =>
      RetailerOrdersPageTabs.map((tab) => ({
        ...tab,
        label:
          tab.label === "Orders"
            ? t("Orders")
            : tab.label === "Item Summary"
            ? t("Item Summary")
            : tab.label,
      })),
    [t]
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-4 mt-5">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4">
            <CommonSelectInput
              options={retailerOptions}
              value={
                selectedRetailer
                  ? {
                      value: String(selectedRetailer._id),
                      label: selectedRetailer.name,
                    }
                  : currentRetailer
                  ? {
                      value: String(currentRetailer._id),
                      label: currentRetailer.name,
                    }
                  : null
              }
              onChange={(selectedOption) => {
                setSelectedRetailer(
                  retailers?.find(
                    (r) => String(r._id) === selectedOption?.value
                  )
                );
                setCurrentPage(1);
                setSearchQuery("");
                setTabPanelKey((prev) => prev + 1);
                setActiveTab(0);
                setSortConfigKey(null);
                navigate(`/retailer/${selectedOption?.value}`);
              }}
              placeholder={t("Select a retailer")}
            />
          </div>
        </div>

        <UnifiedTabPanel
          key={tabPanelKey}
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

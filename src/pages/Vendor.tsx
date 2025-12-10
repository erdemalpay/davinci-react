import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GiTakeMyMoney } from "react-icons/gi";
import {
  MdOutlineCleaningServices,
  MdOutlineMenuBook,
  MdPayments,
} from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import VendorExpenses from "../components/vendor/VendorExpenses";
import VendorPayments from "../components/vendor/VendorPayments";
import VendorProducts from "../components/vendor/VendorProducts";
import VendorServices from "../components/vendor/VendorServices";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { AccountVendor, VendorPageTabEnum } from "../types";
import { useGetAccountVendors } from "../utils/api/account/vendor";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const VendorPageTabs = [
  {
    number: VendorPageTabEnum.VENDORPRODUCTS,
    label: "Vendor Products",
    icon: <MdOutlineMenuBook className="text-lg font-thin" />,
    content: <VendorProducts />,
    isDisabled: false,
  },
  {
    number: VendorPageTabEnum.VENDORSERVICES,
    label: "Vendor Services",
    icon: <MdOutlineCleaningServices className="text-lg font-thin" />,
    content: <VendorServices />,
    isDisabled: false,
  },
  {
    number: VendorPageTabEnum.VENDOREXPENSES,
    label: "Vendor Expenses",
    icon: <GiTakeMyMoney className="text-lg font-thin" />,
    content: <VendorExpenses />,
    isDisabled: false,
  },
  {
    number: VendorPageTabEnum.VENDORPAYMENTS,
    label: "Vendor Payments",
    icon: <MdPayments className="text-lg font-thin" />,
    content: <VendorPayments />,
    isDisabled: false,
  },
];
export default function Vendor() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { resetGeneralContext } = useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState<AccountVendor>();
  const { vendorId } = useParams();
  const vendors = useGetAccountVendors();
  const currentVendor = vendors?.find((item) => item._id === vendorId);
  const { t } = useTranslation();
  const vendorOptions = vendors?.map((i) => {
    return {
      value: i._id,
      label: i.name,
    };
  });
  const currentPageId = "vendor";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  const pageNavigations = [
    {
      name: t("Constants"),
      path: Routes.Accounting,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        resetGeneralContext();
      },
    },
    {
      name: t("Vendor"),
      path: "",
      canBeClicked: false,
    },
  ];
  const currentPageTabs = pages?.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = VendorPageTabs.map((tab) => {
    return {
      ...tab,
      isDisabled:
        user?.role?._id &&
        currentPageTabs
          ?.find((item) => item.name === tab.label)
          ?.permissionRoles?.includes(user.role._id)
          ? false
          : true,
    };
  });

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <CommonSelectInput
              options={vendorOptions}
              value={
                selectedVendor
                  ? {
                      value: selectedVendor._id,
                      label: selectedVendor.name,
                    }
                  : currentVendor
                  ? {
                      value: currentVendor._id,
                      label: currentVendor.name,
                    }
                  : null
              }
              onChange={(selectedOption) => {
                setSelectedVendor(
                  vendors?.find((i) => i._id === selectedOption?.value)
                );
                resetGeneralContext();
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                navigate(`/vendor/${selectedOption?.value}`);
              }}
              placeholder={t("Select a Vendor")}
            />
          </div>
        </div>
        <UnifiedTabPanel
          key={tabPanelKey}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            resetGeneralContext();
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}

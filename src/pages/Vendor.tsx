import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAnchor } from "react-icons/fa";
import { GiTakeMyMoney } from "react-icons/gi";
import {
  MdOutlineCleaningServices,
  MdOutlineMenuBook,
  MdPayments,
} from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import VendorExpenses from "../components/vendor/VendorExpenses";
import VendorFixtures from "../components/vendor/VendorFixtures";
import VendorPayments from "../components/vendor/VendorPayments";
import VendorProducts from "../components/vendor/VendorProducts";
import VendorServices from "../components/vendor/VendorServices";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
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
    number: VendorPageTabEnum.VENDORFIXTURES,
    label: "Vendor Fixtures",
    icon: <FaAnchor className="text-lg font-thin" />,
    content: <VendorFixtures />,
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
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
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
  if (!currentVendor) return <></>;
  const currentPageId = "vendor";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = VendorPageTabs.map((tab) => {
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
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <SelectInput
              options={vendorOptions}
              value={
                selectedVendor
                  ? {
                      value: selectedVendor._id,
                      label: selectedVendor.name,
                    }
                  : {
                      value: currentVendor._id,
                      label: currentVendor.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedVendor(
                  vendors?.find((i) => i._id === selectedOption?.value)
                );
                setCurrentPage(1);
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                setSortConfigKey(null);
                navigate(`/vendor/${selectedOption?.value}`);
              }}
              placeholder={t("Select a Vendor")}
            />
          </div>
        </div>

        <TabPanel
          key={tabPanelKey}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}

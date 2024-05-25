import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GiTakeMyMoney } from "react-icons/gi";
import { MdOutlineMenuBook } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import VendorExpenses from "../components/vendor/VendorExpenses";
import VendorProducts from "../components/vendor/VendorProducts";
import { useGeneralContext } from "../context/General.context";
import { AccountVendor, RowPerPageEnum, VendorPageTabEnum } from "../types";
import { useGetAccountVendors } from "../utils/api/account/vendor";

export default function Vendor() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { vendorId } = useParams();
  const { setCurrentPage, setRowsPerPage, setSearchQuery } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState<AccountVendor>();
  const vendors = useGetAccountVendors();
  const currentVendor = vendors?.find((item) => item._id === vendorId);
  const { t, i18n } = useTranslation();
  const vendorOptions = vendors?.map((i) => {
    return {
      value: i._id,
      label: i.name,
    };
  });

  if (!currentVendor) return <></>;
  const tabs = [
    {
      number: VendorPageTabEnum.VENDORPRODUCTS,
      label: t("Vendor Products"),
      icon: <MdOutlineMenuBook className="text-lg font-thin" />,
      content: <VendorProducts selectedVendor={currentVendor} />,
      isDisabled: false,
    },
    {
      number: VendorPageTabEnum.VENDOREXPENSES,
      label: t("Vendor Expenses"),
      icon: <GiTakeMyMoney className="text-lg font-thin" />,
      content: <VendorExpenses selectedVendor={currentVendor} />,
      isDisabled: false,
    },
  ];
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
                setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                navigate(`/vendor/${selectedOption?.value}`);
              }}
              placeholder={t("Select a Vendor")}
            />
          </div>
        </div>

        <TabPanel
          key={tabPanelKey + i18n.language}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </>
  );
}

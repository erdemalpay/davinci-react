import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GiTakeMyMoney } from "react-icons/gi";
import { MdOutlineMenuBook } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import BrandExpenses from "../components/brand/BrandExpenses";
import BrandProducts from "../components/brand/BrandProducts";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { AccountBrand, BrandPageTabEnum } from "../types";
import { useGetAccountBrands } from "../utils/api/account/brand";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
export const BrandPageTabs = [
  {
    number: BrandPageTabEnum.BRANDPRODUCTS,
    label: "Brand Products",
    icon: <MdOutlineMenuBook className="text-lg font-thin" />,
    content: <BrandProducts />,
    isDisabled: false,
  },
  {
    number: BrandPageTabEnum.BRANDEXPENSES,
    label: "Brand Expenses",
    icon: <GiTakeMyMoney className="text-lg font-thin" />,
    content: <BrandExpenses />,
    isDisabled: false,
  },
];
export default function Brand() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<AccountBrand>();
  const brands = useGetAccountBrands();
  const { brandId } = useParams();
  const currentBrand = brands?.find((item) => item._id === brandId);
  if (!currentBrand) return <></>;
  const { t } = useTranslation();
  const brandOptions = brands?.map((i) => {
    return {
      value: i._id,
      label: i.name,
    };
  });
  const pageNavigations = [
    {
      name: t("Constants"),
      path: Routes.Accounting,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setCurrentPage(1);
        // setRowsPerPage(RowPerPageEnum.FIRST);
        setSortConfigKey(null);
        setSearchQuery("");
      },
    },
    {
      name: t("Brand"),
      path: "",
      canBeClicked: false,
    },
  ];
  const currentPageId = "brand";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = BrandPageTabs.map((tab) => {
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
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <SelectInput
              options={brandOptions}
              value={
                selectedBrand
                  ? {
                      value: selectedBrand._id,
                      label: selectedBrand.name,
                    }
                  : {
                      value: currentBrand._id,
                      label: currentBrand.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedBrand(
                  brands?.find((i) => i._id === selectedOption?.value)
                );
                setCurrentPage(1);
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                setSortConfigKey(null);
                navigate(`/brand/${selectedOption?.value}`);
              }}
              placeholder={t("Select a Brand")}
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

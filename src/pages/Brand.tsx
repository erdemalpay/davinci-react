import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAnchor } from "react-icons/fa";
import { GiTakeMyMoney } from "react-icons/gi";
import { MdOutlineMenuBook } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import BrandExpenses from "../components/brand/BrandExpenses";
import BrandFixtures from "../components/brand/BrandFixtures";
import BrandProducts from "../components/brand/BrandProducts";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { AccountBrand, BrandPageTabEnum } from "../types";
import { useGetAccountBrands } from "../utils/api/account/brand";

export default function Brand() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { brandId } = useParams();
  const { setCurrentPage, setRowsPerPage, setSearchQuery } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<AccountBrand>();
  const brands = useGetAccountBrands();
  const currentBrand = brands?.find((item) => item._id === brandId);
  const { t, i18n } = useTranslation();
  const brandOptions = brands?.map((i) => {
    return {
      value: i._id,
      label: i.name,
    };
  });

  if (!currentBrand) return <></>;
  const tabs = [
    {
      number: BrandPageTabEnum.BRANDPRODUCTS,
      label: t("Brand Products"),
      icon: <MdOutlineMenuBook className="text-lg font-thin" />,
      content: <BrandProducts selectedBrand={currentBrand} />,
      isDisabled: false,
    },
    {
      number: BrandPageTabEnum.BRANDFIXTURES,
      label: t("Brand Fixtures"),
      icon: <FaAnchor className="text-lg font-thin" />,
      content: <BrandFixtures selectedBrand={currentBrand} />,
      isDisabled: false,
    },
    {
      number: BrandPageTabEnum.BRANDEXPENSES,
      label: t("Brand Expenses"),
      icon: <GiTakeMyMoney className="text-lg font-thin" />,
      content: <BrandExpenses selectedBrand={currentBrand} />,
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
                navigate(`/Brand/${selectedOption?.value}`);
              }}
              placeholder={t("Select a Brand")}
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

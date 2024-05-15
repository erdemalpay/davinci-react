import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RiBarChartFill } from "react-icons/ri";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import ProductPrice from "../components/product/ProductPrice";
import { useGeneralContext } from "../context/General.context";
import { AccountProduct, AccountUnit, RowPerPageEnum } from "../types";
import { useGetAccountProducts } from "../utils/api/account/product";

export default function Product() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { productId } = useParams();
  const { setCurrentPage, setRowsPerPage, setSearchQuery } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<AccountProduct>();
  const products = useGetAccountProducts();
  const currentProduct = products?.find((product) => product._id === productId);
  const { t } = useTranslation();
  const productOption = products?.map((p) => {
    return {
      value: p._id,
      label: p.name + `(${(p.unit as AccountUnit).name})`,
    };
  });

  if (!currentProduct) return <></>;
  const tabs = [
    {
      number: 0,
      label: t("Product Price Chart"),
      icon: <RiBarChartFill className="text-lg font-thin" />,
      content: <ProductPrice selectedProduct={currentProduct} />,
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
              options={productOption}
              value={
                selectedProduct
                  ? {
                      value: selectedProduct._id,
                      label: selectedProduct.name,
                    }
                  : {
                      value: currentProduct._id,
                      label: currentProduct.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedProduct(
                  products?.find((p) => p._id === selectedOption?.value)
                );
                setCurrentPage(1);
                setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                navigate(`/product/${selectedOption?.value}`);
              }}
              placeholder={t("Select a product")}
            />
          </div>
        </div>

        <TabPanel
          key={tabPanelKey}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </>
  );
}

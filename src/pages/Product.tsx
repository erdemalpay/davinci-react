import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GiArchiveResearch, GiTakeMyMoney } from "react-icons/gi";
import { MdOutlineMenuBook } from "react-icons/md";
import { RiBarChartFill } from "react-icons/ri";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/common/Loading";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import MenuItemsWithProduct from "../components/product/MenuItemsWithProduct";
import ProductExpenses from "../components/product/ProductExpenses";
import ProductPrice from "../components/product/ProductPrice";
import ProductStockHistory from "../components/product/ProductStockHistory";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { AccountProduct, ProductPageTabEnum } from "../types";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const ProductPageTabs = [
  {
    number: ProductPageTabEnum.PRODUCTPRICECHART,
    label: "Product Price Chart",
    icon: <RiBarChartFill className="text-lg font-thin" />,
    content: <ProductPrice />,
    isDisabled: false,
  },
  {
    number: ProductPageTabEnum.MENUITEMSWITHPRODUCT,
    label: "Menu Items with Product",
    icon: <MdOutlineMenuBook className="text-lg font-thin" />,
    content: <MenuItemsWithProduct />,
    isDisabled: false,
  },
  {
    number: ProductPageTabEnum.PRODUCTEXPENSES,
    label: "Product Expenses",
    icon: <GiTakeMyMoney className="text-lg font-thin" />,
    content: <ProductExpenses />,
    isDisabled: false,
  },
  {
    number: ProductPageTabEnum.PRODUCTSTOCKHISTORY,
    label: "Product Stock History",
    icon: <GiArchiveResearch className="text-lg font-thin" />,
    content: <ProductStockHistory />,
    isDisabled: false,
  },
];
export default function Product() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<AccountProduct>();
  const { productId } = useParams();
  const products = useGetAccountProducts();
  const currentProduct = products?.find((product) => product._id === productId);
  const { t } = useTranslation();
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
      name: t("Product"),
      path: "",
      canBeClicked: false,
    },
  ];
  const productOption = products?.map((p) => {
    return {
      value: p._id,
      label: p.name,
    };
  });
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!products || !pages || !user || !currentProduct) {
    return <Loading />;
  }
  const currentPageId = "product";
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = ProductPageTabs.map((tab) => {
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
            <CommonSelectInput
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
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                setSortConfigKey(null);
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
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}

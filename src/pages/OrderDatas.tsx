import { BiCategory } from "react-icons/bi";
import { BsClipboard2Data } from "react-icons/bs";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { SiFampay } from "react-icons/si";
import {
  TbCategoryPlus,
  TbDiscount,
  TbReportAnalytics,
  TbReportMoney,
  TbReportSearch,
} from "react-icons/tb";
import { Header } from "../components/header/Header";
import CategoryBasedSalesReport from "../components/orderDatas/CategoryBasedSalesReport";
import Collections from "../components/orderDatas/Collections";
import DailyIncome from "../components/orderDatas/DailyIncome";
import DiscountBasedSales from "../components/orderDatas/DiscountBasedSales";
import GroupedProductSalesReport from "../components/orderDatas/GroupedProductSalesReport";
import IkasOrders from "../components/orderDatas/IkasOrders";
import KitchenDataPage from "../components/orderDatas/KitchenDataPage";
import OrdersReport from "../components/orderDatas/OrdersReport";
import PersonalOrderDatas from "../components/orderDatas/PersonalOrderDatas";
import SingleProductSalesReport from "../components/orderDatas/SingleProductSalesReport";
import UpperCategoryBasedSalesReport from "../components/orderDatas/UpperCategoryBasedSalesReport";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useOrderContext } from "../context/Order.context";
import { useUserContext } from "../context/User.context";
import { OrderDataTabEnum } from "../types";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const OrderDataTabs = () => {
  const categories = useGetCategories();
  const enumTabCount = Object.keys(OrderDataTabEnum).length / 2;
  return [
    {
      number: OrderDataTabEnum.DAILYINCOME,
      label: "Daily Income",
      icon: <TbReportMoney className="text-lg font-thin" />,
      content: <DailyIncome />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.GROUPEDPRODUCTSALESREPORT,
      label: "Product Sales",
      icon: <HiOutlineDocumentReport className="text-lg font-thin" />,
      content: <GroupedProductSalesReport />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.SINGLEPRODUCTSALESREPORT,
      label: "Product Based Sales",
      icon: <TbReportSearch className="text-lg font-thin" />,
      content: <SingleProductSalesReport />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.UPPERCATEGORYBASEDSALESREPORT,
      label: "Upper Category Based Sales",
      icon: <TbCategoryPlus className="text-lg font-thin" />,
      content: <UpperCategoryBasedSalesReport />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.CATEGORYBASEDSALESREPORT,
      label: "Category Based Sales",
      icon: <BiCategory className="text-lg font-thin" />,
      content: <CategoryBasedSalesReport />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.DISCOUNTBASEDSALES,
      label: "Discount Based Sales",
      icon: <TbDiscount className="text-lg font-thin" />,
      content: <DiscountBasedSales />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.COLLECTIONS,
      label: "Collections",
      icon: <SiFampay className="text-lg font-thin" />,
      content: <Collections />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.ORDERS,
      label: "Cafe Orders",
      icon: <TbReportAnalytics className="text-lg font-thin" />,
      content: <OrdersReport />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.IKASORDERS,
      label: "Ikas Orders",
      icon: <TbReportAnalytics className="text-lg font-thin" />,
      content: <IkasOrders />,
      isDisabled: false,
    },
    {
      number: OrderDataTabEnum.PERSONALORDERDATAS,
      label: "Personal Order Datas",
      icon: <BsClipboard2Data className="text-lg font-thin" />,
      content: <PersonalOrderDatas />,
      isDisabled: false,
    },
    ...(categories ?? [])
      .filter((cat) => cat?.isKitchenMenu)
      .map((category, index) => ({
        number: enumTabCount + index,
        label: category.name,
        content: (
          <KitchenDataPage
            categoryId={category._id}
            categoryName={category.name}
          />
        ),
        isDisabled: false,
        kitchen: null,
      })),
  ];
};

const OrderDatas = () => {
  const {
    setCurrentPage,
    setSearchQuery,
    orderDataActiveTab,
    setOrderDataActiveTab,
  } = useGeneralContext();
  const { setFilterPanelFormElements, filterPanelFormElements } =
    useOrderContext();
  const currentPageId = "order_datas";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = OrderDataTabs().map((tab) => {
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
      <TabPanel
        tabs={tabs}
        activeTab={orderDataActiveTab}
        setActiveTab={setOrderDataActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
      />
    </>
  );
};

export default OrderDatas;

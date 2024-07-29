import { BiCategory } from "react-icons/bi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { TbDiscount, TbReportMoney, TbReportSearch } from "react-icons/tb";
import { Header } from "../components/header/Header";
import CategoryBasedSalesReport from "../components/orderDatas/CategoryBasedSalesReport";
import DailyIncome from "../components/orderDatas/DailyIncome";
import DiscountBasedSales from "../components/orderDatas/DiscountBasedSales";
import GroupedProductSalesReport from "../components/orderDatas/GroupedProductSalesReport";
import SingleProductSalesReport from "../components/orderDatas/SingleProductSalesReport";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { OrderDataTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const OrderDataTabs = [
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
];
const OrderDatas = () => {
  const {
    setCurrentPage,
    setSearchQuery,
    orderDataActiveTab,
    setOrderDataActiveTab,
  } = useGeneralContext();
  const currentPageId = "order_datas";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = OrderDataTabs.map((tab) => {
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

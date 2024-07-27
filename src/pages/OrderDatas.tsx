import { HiOutlineDocumentReport } from "react-icons/hi";
import { Header } from "../components/header/Header";
import ProductSalesReport from "../components/orderDatas/ProductSalesReport";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { OrderDataTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const OrderDataTabs = [
  {
    number: OrderDataTabEnum.PRODUCTSALESREPORT,
    label: "Product Sales Report",
    icon: <HiOutlineDocumentReport className="text-lg font-thin" />,
    content: <ProductSalesReport />,
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

import { HiOutlineUsers } from "react-icons/hi2";
import CafeCustomers from "../components/consumer/CafeCustomers";
import ShopifyCustomers from "../components/consumer/ShopifyCustomers";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { ConsumerPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const ConsumerPageTabs = [
  {
    number: ConsumerPageTabEnum.CAFE_CUSTOMERS,
    label: "Cafe Customers",
    icon: <HiOutlineUsers className="text-lg font-thin" />,
    content: <CafeCustomers />,
    isDisabled: false,
  },
  {
    number: ConsumerPageTabEnum.SHOPIFY_CUSTOMERS,
    label: "Shopify Customers",
    icon: <HiOutlineUsers className="text-lg font-thin" />,
    content: <ShopifyCustomers />,
    isDisabled: false,
  },
];

export default function Consumer() {
  const {
    setCurrentPage,
    setSearchQuery,
    consumerActiveTab,
    setConsumerActiveTab,
  } = useGeneralContext();
  const currentPageId = "consumers";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = ConsumerPageTabs.map((tab) => {
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
      <div className="flex flex-col gap-2 mt-5">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={consumerActiveTab}
          setActiveTab={setConsumerActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}

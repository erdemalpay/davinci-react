import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";

import { useEffect, useState } from "react";
import SingleOrdersPage from "../components/orders/SingleOrdersPage";
import { useGetKitchens } from "../utils/api/menu/kitchen";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

function Orders() {
  const {
    setCurrentPage,
    setSearchQuery,
    ordersActiveTab,
    setOrdersActiveTab,
  } = useGeneralContext();
  const currentPageId = "orders";
  const kitchens = useGetKitchens();
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0 || !kitchens) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const orderTabs = kitchens.map((kitchen, index) => ({
    number: index,
    label: kitchen.name,
    content: <SingleOrdersPage kitchen={kitchen._id} />,
    isDisabled: false,
  }));
  const [tabs, setTabs] = useState(
    orderTabs?.map((tab) => {
      return {
        ...tab,
        isDisabled: currentPageTabs
          ?.find((item) => item.name === tab.label)
          ?.permissionRoles?.includes(user.role._id)
          ? false
          : true,
      };
    })
  );
  useEffect(() => {
    setTabs(
      orderTabs?.map((tab) => {
        return {
          ...tab,
          isDisabled: currentPageTabs
            ?.find((item) => item.name === tab.label)
            ?.permissionRoles?.includes(user.role._id)
            ? false
            : true,
        };
      })
    );
    setOrdersActiveTab(0);
  }, [kitchens]);
  return (
    <>
      <Header showLocationSelector={false} />
      <TabPanel
        tabs={tabs ?? []}
        activeTab={ordersActiveTab}
        setActiveTab={setOrdersActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
      />
    </>
  );
}

export default Orders;

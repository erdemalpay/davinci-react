import { useState } from "react";
import { useOrderContext } from "../../context/Order.context";
import TabPanel from "../panelComponents/TabPanel/TabPanel";
import NewOrderDiscounts from "./NewOrderDiscounts";
import NewOrderListPanel from "./NewOrderListPanel";

const OrderTakeawayPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { isNewOrderDiscountScreenOpen } = useOrderContext();
  const tabs = [
    {
      number: 0,
      label: "New Orders",
      content: isNewOrderDiscountScreenOpen ? (
        <NewOrderDiscounts />
      ) : (
        <NewOrderListPanel />
      ),
      isDisabled: false,
    },
  ];
  return (
    <div className="bg-white rounded-md md:rounded-r-none  max-w-full  max-h-[60vh]  sm:max-h-[100vh]  z-[100]  ">
      <div className="flex flex-col gap-2 px-4 py-6">
        <TabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          topClassName="min-h-80 max-h-80 overflow-scroll no-scrollbar   "
        />
      </div>
    </div>
  );
};

export default OrderTakeawayPanel;

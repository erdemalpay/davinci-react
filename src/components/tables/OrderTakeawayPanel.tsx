import { useState } from "react";
import UnifiedTabPanel from "../../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../../context/General.context";
import NewOrderListPanel from "./NewOrderListPanel";

const OrderTakeawayPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { isTabInputScreenOpen } = useGeneralContext();

  const tabs = [
    {
      number: 0,
      label: "New Orders",
      content: <NewOrderListPanel />,
      isDisabled: false,
    },
  ];
  return (
    <div
      className={`bg-white rounded-md md:rounded-r-none  max-w-full  max-h-[60vh]  sm:max-h-[100vh]  z-[100] ${
        isTabInputScreenOpen && "hidden sm:block"
      }`}
    >
      <div className="flex flex-col gap-2 px-4 py-6">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          topClassName="min-h-80 max-h-80 overflow-scroll no-scrollbar   "
          allowOrientationToggle={true}
        />
      </div>
    </div>
  );
};

export default OrderTakeawayPanel;

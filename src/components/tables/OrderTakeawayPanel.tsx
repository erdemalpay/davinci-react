import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import UnifiedTabPanel from "../../components/panelComponents/TabPanel/UnifiedTabPanel";
import NewOrderListPanel from "./NewOrderListPanel";

const OrderTakeawayPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { isTabInputScreenOpen } = useGeneralContext();
  const { orderCreateBulk } = useOrderContext();
  const [expandedSections, setExpandedSections] = useState<{
    [key: number]: boolean;
  }>({ 0: true });
  const { t } = useTranslation();

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const orderCounts = useMemo(() => {
    const newOrdersCount = orderCreateBulk?.length || 0;
    return {
      newOrders: newOrdersCount,
    };
  }, [orderCreateBulk]);

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
      <div className="flex flex-col sm:gap-2 gap-1 px-4 py-6 sm:pb-6 pb-0">
        {/* Desktop: Tab Panel */}
        <div className="hidden sm:block">
          <UnifiedTabPanel
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            topClassName="min-h-80 max-h-80 overflow-scroll no-scrollbar   "
            allowOrientationToggle={true}
          />
        </div>

        {/* Mobile: Collapsible Sections */}
        <div className="sm:hidden flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
          {tabs.map((tab) => (
            <div key={tab.number} className="border border-gray-300 rounded-md">
              <button
                onClick={() => toggleSection(tab.number)}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-md"
              >
                <span className="font-medium text-sm">
                  {t(tab.label)}
                  <span className="ml-1 text-gray-600">
                    ({orderCounts.newOrders})
                  </span>
                </span>
                {expandedSections[tab.number] ? (
                  <FaChevronUp className="text-gray-600" />
                ) : (
                  <FaChevronDown className="text-gray-600" />
                )}
              </button>
              {expandedSections[tab.number] && (
                <div className="px-2 py-1.5 max-h-64 overflow-y-auto">
                  {tab.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderTakeawayPanel;

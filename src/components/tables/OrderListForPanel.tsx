import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import UnifiedTabPanel from "../../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import { Order, OrderStatus, Table } from "../../types";
import NewOrderListPanel from "./NewOrderListPanel";
import OrderListForPanelTab from "./OrderListForPanelTab";

type Props = { table: Table; tableOrdersProp?: Order[] };

const OrderListForPanel = ({ table, tableOrdersProp }: Props) => {
  const { isTabInputScreenOpen } = useGeneralContext();
  const { orderCreateBulk } = useOrderContext();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{
    [key: number]: boolean;
  }>({ 0: false, 1: false, 2: false });
  const { t } = useTranslation();

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Calculate counts for each section
  const orderCounts = useMemo(() => {
    const newOrdersCount = orderCreateBulk?.length || 0;

    const waitingCount = tableOrdersProp?.filter((order) =>
      [
        OrderStatus.PENDING,
        OrderStatus.READYTOSERVE,
        OrderStatus.CONFIRMATIONREQ,
      ].includes(order.status as OrderStatus)
    )?.length || 0;

    const servedCount = tableOrdersProp?.filter((order) =>
      [OrderStatus.SERVED, OrderStatus.AUTOSERVED].includes(
        order.status as OrderStatus
      )
    )?.length || 0;

    return {
      newOrders: newOrdersCount,
      waiting: waitingCount,
      served: servedCount,
    };
  }, [orderCreateBulk, tableOrdersProp]);

  const tabs = [
    {
      number: 0,
      label: "New Orders",
      content: <NewOrderListPanel />,
      isDisabled: false,
    },
    {
      number: 1,
      label: "Waiting",
      content: (
        <OrderListForPanelTab
          tableId={table?._id}
          tableOrdersProp={tableOrdersProp}
          orderStatus={[
            OrderStatus.PENDING,
            OrderStatus.READYTOSERVE,
            OrderStatus.CONFIRMATIONREQ,
          ]}
        />
      ),
      isDisabled: false,
    },
    {
      number: 2,
      label: "Served",
      content: (
        <OrderListForPanelTab
          orderStatus={[OrderStatus.SERVED, OrderStatus.AUTOSERVED]}
          tableId={table?._id}
          tableOrdersProp={tableOrdersProp}
        />
      ),
      isDisabled: false,
    },
  ];
  return (
    <div
      className={`bg-white rounded-md  md:rounded-r-none  max-w-full  max-h-[60vh]  sm:max-h-[100vh]  z-[100] ${
        isTabInputScreenOpen && "hidden sm:block"
      } `}
    >
      <div className="flex flex-col sm:gap-2 gap-1 px-4 py-6 sm:pb-6 pb-0">
        {/* header */}
        <h1 className="font-medium">
          {t("Table")}: {table?.name}
        </h1>

        {/* Desktop: Tab Panel */}
        <div className="hidden sm:block">
          <UnifiedTabPanel
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            topClassName="min-h-64 max-h-64 sm:max-h-[32rem] sm:min-h-[32rem] overflow-scroll no-scrollbar h-full  "
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
                    ({tab.number === 0 ? orderCounts.newOrders : tab.number === 1 ? orderCounts.waiting : orderCounts.served})
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

export default OrderListForPanel;

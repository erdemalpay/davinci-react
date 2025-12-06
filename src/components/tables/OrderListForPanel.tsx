import { useState } from "react";
import { useTranslation } from "react-i18next";
import UnifiedTabPanel from "../../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../../context/General.context";
import { Order, OrderStatus, Table } from "../../types";
import NewOrderListPanel from "./NewOrderListPanel";
import OrderListForPanelTab from "./OrderListForPanelTab";

type Props = { table: Table; tableOrdersProp?: Order[] };

const OrderListForPanel = ({ table, tableOrdersProp }: Props) => {
  const { isTabInputScreenOpen } = useGeneralContext();
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslation();
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
      <div className="flex flex-col gap-2 px-4 py-6 ">
        {/* header */}
        <h1 className="font-medium">
          {t("Table")}: {table?.name}
        </h1>
        {/* orders */}
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          topClassName="min-h-64 max-h-64 sm:max-h-[32rem] sm:min-h-[32rem] overflow-scroll no-scrollbar h-full  "
          allowOrientationToggle={true}
        />
      </div>
    </div>
  );
};

export default OrderListForPanel;

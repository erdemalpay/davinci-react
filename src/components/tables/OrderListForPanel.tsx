import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { OrderStatus, Table } from "../../types";
import Loading from "../common/Loading";
import TabPanel from "../panelComponents/TabPanel/TabPanel";
import NewOrderListPanel from "./NewOrderListPanel";
import OrderListForPanelTab from "./OrderListForPanelTab";

type Props = { table: Table };

const OrderListForPanel = ({ table }: Props) => {
  const { user } = useUserContext();
  const { isTabInputScreenOpen } = useGeneralContext();
  const [activeTab, setActiveTab] = useState(0);
  if (!table || !user) return <Loading />;
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
          tableId={table._id}
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
          tableId={table._id}
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
          {t("Table")}: {table.name}
        </h1>
        {/* orders */}
        <TabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          topClassName="min-h-64 max-h-64 sm:max-h-[32rem] sm:min-h-[32rem] overflow-scroll no-scrollbar h-full  "
        />
      </div>
    </div>
  );
};

export default OrderListForPanel;

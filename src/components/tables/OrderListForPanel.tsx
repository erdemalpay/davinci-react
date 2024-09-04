import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import { Order, OrderStatus, Table } from "../../types";
import TabPanel from "../panelComponents/TabPanel/TabPanel";
import OrderListForPanelTab from "./OrderListForPanelTab";

type Props = { table: Table };

const OrderListForPanel = ({ table }: Props) => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState(0);
  if (!table || !user) return null;
  const { t } = useTranslation();
  const tabs = [
    {
      number: 0,
      label: "Waiting",
      content: (
        <OrderListForPanelTab
          orders={
            (table?.orders as Order[])?.filter((order) =>
              [OrderStatus.PENDING, OrderStatus.READYTOSERVE].includes(
                order.status as OrderStatus
              )
            ) ?? []
          }
          user={user}
        />
      ),
      isDisabled: false,
    },
    {
      number: 1,
      label: "Served",
      content: (
        <OrderListForPanelTab
          orders={
            (table?.orders as Order[])?.filter(
              (order) =>
                ![OrderStatus.PENDING, OrderStatus.READYTOSERVE].includes(
                  order.status as OrderStatus
                )
            ) ?? []
          }
          user={user}
        />
      ),
      isDisabled: false,
    },
  ];
  return (
    <div className="bg-white rounded-md md:rounded-r-none  max-w-full  max-h-[60vh]  sm:max-h-[100vh]  z-[100]  ">
      <div className="flex flex-col gap-2 px-4 py-6">
        {/* header */}
        <h1 className="font-medium">
          {t("Table")}: {table.name}
        </h1>
        {/* orders */}
        <TabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          topClassName="min-h-64 max-h-64 overflow-scroll no-scrollbar   "
        />
      </div>
    </div>
  );
};

export default OrderListForPanel;

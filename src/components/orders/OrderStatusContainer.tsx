import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import { Kitchen, Order, OrderStatus, Table } from "../../types";
import { useUpdateMultipleOrderMutation } from "../../utils/api/order/order";
import SingleOrderCard from "./SingleOrderCard";

type Props = {
  status: string;
  orders: Order[];
  icon: React.ReactNode;
  iconBackgroundColor: string;
  kitchen: Kitchen;
};

const OrderStatusContainer = ({
  status,
  orders,
  icon,
  iconBackgroundColor,
  kitchen,
}: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  if (!user) return <></>;
  const [expandedTables, setExpandedTables] = useState<{
    [key: string]: boolean;
  }>({});
  const toggleTable = (tableId: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableId]: !prev[tableId],
    }));
  };
  const groupedOrders = orders.reduce<{ [key: string]: Order[] }>(
    (acc, order) => {
      const tableId = (order?.table as Table)?._id;
      if (!acc[tableId]) {
        acc[tableId] = [];
      }

      acc[tableId].push(order);
      return acc;
    },
    {}
  );
  const getEarliestDate = (orders: Order[]): Date | null => {
    return orders.reduce<Date | null>((earliest, order) => {
      let date: Date | null = null;
      switch (order.status) {
        case OrderStatus.PENDING:
          date = new Date(order.createdAt);
          break;
        case OrderStatus.READYTOSERVE:
          date = order.preparedAt ? new Date(order.preparedAt) : null;
          break;
        case OrderStatus.SERVED:
          date = order.deliveredAt ? new Date(order.deliveredAt) : null;
          break;
      }

      if (date === null) {
        return earliest;
      }

      if (!earliest || date > earliest) {
        return date;
      }
      return earliest;
    }, null);
  };

  const sortedGroupedOrders = Object.entries(groupedOrders).sort((a, b) => {
    const earliestA = getEarliestDate(a[1]);
    const earliestB = getEarliestDate(b[1]);
    if (earliestA === null && earliestB === null) {
    }
    if (earliestA === null) {
      return 1;
    }
    if (earliestB === null) {
      return -1;
    }
    return earliestB.getTime() - earliestA.getTime();
  });
  useEffect(() => {
    for (const [tableId, tableOrders] of sortedGroupedOrders) {
      const isTableOpen = !(tableOrders[0]?.table as Table)?.finishHour;
      if (isTableOpen) {
        setExpandedTables((prev) => ({
          ...prev,
          [tableId]: status !== "Served",
        }));
      }
    }
  }, [orders]);

  const { mutate: updateMultipleOrders } = useUpdateMultipleOrderMutation();

  return (
    <div className="w-full min-h-screen relative border border-gray-200 rounded-lg bg-white shadow-lg __className_a182b8 mx-auto h-full pb-4 mb-4">
      <div className="relative flex items-center mt-2 mb-4">
        {/* Icon - positioned absolutely within the container */}
        <div
          className={`absolute left-1 -top-6 px-4 py-4 rounded-md border ${iconBackgroundColor}`}
        >
          {icon}
        </div>

        {/* Status and Orders Count - padded to avoid overlap */}
        <div className="flex flex-col justify-center w-full ml-16 space-y-1">
          <div className="flex items-center space-x-2 text-lg sm:text-base font-medium">
            <h1>{t(status)}</h1>
            <h1>({orders.length})</h1>
          </div>
        </div>
      </div>
      {/* orders */}
      <div className="flex flex-col gap-4 px-2">
        {/* grouped tables  */}
        {sortedGroupedOrders?.map(([tableId, tableOrders]) => (
          <div key={tableId} className=" flex flex-col gap-1 px-1 ">
            <div className="flex justify-between">
              <h2
                onClick={() => toggleTable(tableId)}
                className="font-semibold text-blue-800  flex gap-2  cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                {t("Table")} {(tableOrders[0]?.table as Table)?.name}
                <span // Toggle icon
                  className="inline-flex  cursor-pointer"
                >
                  {expandedTables[tableId] ? "▲" : "▼"}
                </span>
              </h2>
              {/* pending case all ready button */}
              {status === "Pending" && (
                <button
                  onClick={() => {
                    updateMultipleOrders({
                      ids: tableOrders.map((order) => order._id),
                      updates: {
                        status: OrderStatus.READYTOSERVE,
                        preparedAt: new Date(),
                        preparedBy: user._id,
                      },
                    });
                  }}
                  className="bg-green-500 text-white px-2  rounded-lg"
                >
                  {t("All Ready")}
                </button>
              )}
              {/* TODO:Fix here  */}
              {/* ready to serve case all served button */}
              {status === "Ready to Serve" && (
                <button
                  onClick={() => {
                    updateMultipleOrders({
                      ids: tableOrders.map((order) => order._id),
                      updates: {
                        status: OrderStatus.SERVED,
                        deliveredAt: new Date(),
                        deliveredBy: user._id,
                      },
                    });
                  }}
                  className="bg-green-500 text-white px-2  rounded-lg"
                >
                  {t("All Served")}
                </button>
              )}
            </div>
            {/* single order card in a table  */}
            {expandedTables[tableId] && (
              <div className="flex flex-col gap-2">
                {[...tableOrders].reverse().map((order) => (
                  <SingleOrderCard key={order._id} order={order} user={user} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusContainer;

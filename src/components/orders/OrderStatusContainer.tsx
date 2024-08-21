import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import { Order, OrderStatus, Table } from "../../types";
import { useUpdateMultipleOrderMutation } from "../../utils/api/order/order";
import SingleOrderCard from "./SingleOrderCard";
type Props = {
  status: string;
  orders: Order[];
  icon: React.ReactNode;
  iconBackgroundColor: string;
};

const OrderStatusContainer = ({
  status,
  orders,
  icon,
  iconBackgroundColor,
}: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  if (!user) return <></>;
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
  const { mutate: updateMultipleOrders } = useUpdateMultipleOrderMutation();

  return (
    <div className="w-full min-h-screen relative border border-gray-200 rounded-lg bg-white shadow-lg __className_a182b8 mx-auto h-full pb-4 mb-4">
      {/* icon */}
      <div
        className={`absolute left-3 top-[-1.5rem] px-4 py-4 border ${iconBackgroundColor}`}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-12 mt-2">
        {/* status */}
        <div className=" w-5/6 flex ml-auto">
          <div className="flex gap-0.5 ml-2 sm:ml-0">
            <h1 className="font-medium ">{t(status)}</h1>
            <h1 className="font-medium">
              {"("}
              {orders.length}
              {")"}
            </h1>
          </div>
        </div>
        {/* orders */}
        <div className="flex flex-col gap-4 px-2">
          {/* grouped tables  */}
          {Object.entries(groupedOrders)?.map(([tableId, tableOrders]) => (
            <div key={tableId} className=" flex flex-col gap-1 px-1 ">
              <div className="flex justify-between">
                <h2 className="font-semibold text-blue-800 ">
                  {t("Table")} {(tableOrders[0]?.table as Table)?.name}
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
                    className="bg-green-500 text-white px-2 py-0.5 rounded-lg"
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
              <div className="flex flex-col gap-2">
                {tableOrders?.map((order) => (
                  <SingleOrderCard key={order._id} order={order} user={user} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusContainer;

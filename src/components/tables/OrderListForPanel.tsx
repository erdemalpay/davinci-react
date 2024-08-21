import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { MenuItem, Order, OrderStatus, TableStatus } from "../../types";
import {
  useGetGivenDateOrders,
  useOrderMutations,
} from "../../utils/api/order/order";
import { useGetTables } from "../../utils/api/table";

type Props = { tableId: number };

const OrderListForPanel = ({ tableId }: Props) => {
  const tables = useGetTables().filter(
    (table) => table?.status !== TableStatus.CANCELLED
  );
  const table = tables.find((table) => table._id === tableId);
  const { user } = useUserContext();
  if (!table || !user) return null;
  const { t } = useTranslation();
  const orders = useGetGivenDateOrders();
  const { updateOrder } = useOrderMutations();
  const orderWaitTime = (order: Order) => {
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - orderTime) / 60000);
  };
  return (
    <div className="bg-white rounded-md md:rounded-r-none  max-w-full  max-h-[60vh]  sm:max-h-[90vh]  z-[100]  ">
      <div className="flex flex-col gap-2 px-4 py-6">
        {/* header */}
        <h1 className="font-medium">{t("Orders")}</h1>
        {/* orders */}
        <div className="overflow-scroll no-scrollbar h-64 border border-gray-200 rounded-md bg-white shadow-sm px-2 py-1  ">
          {table.orders?.map((tableOrder) => {
            const order = orders.find((order) => order._id === tableOrder);
            if (
              !order ||
              !(
                order.status === OrderStatus.PENDING ||
                order.status === OrderStatus.AUTOSERVED
              )
            )
              return null;
            return (
              <div
                key={order._id}
                className={`flex justify-between text-xs  rounded-lg items-center px-2 py-2 `}
              >
                <div className="flex w-5/6 gap-1">
                  <p>{(order.item as MenuItem).name} </p>
                  <h1 className="text-xs">({order.quantity})</h1>
                </div>

                <div className="flex flex-row ">
                  {(order.status === OrderStatus.PENDING ||
                    order.status === OrderStatus.AUTOSERVED) && (
                    <div className="flex flex-row gap-[1px]">
                      <h5 className="text-xs whitespace-nowrap min-w-8">
                        {orderWaitTime(order)} m
                      </h5>

                      {order.paidQuantity === 0 && (
                        <HiOutlineTrash
                          className="text-red-400 hover:text-red-700 cursor-pointer text-lg px-[0.5px]"
                          onClick={() =>
                            updateOrder({
                              id: order._id,
                              updates: {
                                status: OrderStatus.CANCELLED,
                                cancelledAt: new Date(),
                                cancelledBy: user._id,
                              },
                            })
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderListForPanel;

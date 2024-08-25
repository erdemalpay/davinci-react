import { useTranslation } from "react-i18next";
import { FiMinusCircle } from "react-icons/fi";
import { GoPlusCircle } from "react-icons/go";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { MenuItem, Order, OrderStatus, Table } from "../../types";
import {
  useGetGivenDateOrders,
  useOrderMutations,
} from "../../utils/api/order/order";

type Props = { table: Table };

const OrderListForPanel = ({ table }: Props) => {
  const { user } = useUserContext();
  if (!table || !user) return null;
  const { t } = useTranslation();
  const orders = useGetGivenDateOrders();
  const { updateOrder, createOrder } = useOrderMutations();
  const orderWaitTime = (order: Order) => {
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - orderTime) / 60000);
  };
  return (
    <div className="bg-white rounded-md md:rounded-r-none  max-w-full  max-h-[60vh]  sm:max-h-[100vh]  z-[100]  ">
      <div className="flex flex-col gap-2 px-4 py-6">
        {/* header */}
        <h1 className="font-medium">{table.name}</h1>
        {/* orders */}
        <div className="overflow-scroll no-scrollbar h-64 border border-gray-200 rounded-md bg-white shadow-sm px-2 py-1  ">
          {table.orders?.map((tableOrder) => {
            const order = orders.find((order) => order._id === tableOrder);
            if (!order || order.status === OrderStatus.CANCELLED) return null;
            return (
              <div
                key={order._id}
                className={`flex justify-between text-xs  rounded-lg items-center px-2 py-2 `}
              >
                <div className="flex flex-row gap-2  items-center  ">
                  {/* decrement */}
                  <FiMinusCircle
                    className="w-5 h-5 flex-shrink-0  text-red-500  hover:text-red-800 cursor-pointer focus:outline-none"
                    onClick={() => {
                      if (order.quantity === 1) {
                        toast.error(t("Order quantity cannot be less than 1"));
                        return;
                      }
                      if (order.paidQuantity > 0) {
                        toast.error(t("Paid orders cannot be changed"));
                        return;
                      }
                      if (
                        ![
                          OrderStatus.READYTOSERVE,
                          OrderStatus.SERVED,
                        ].includes(order.status as OrderStatus) &&
                        !order.discount
                      ) {
                        updateOrder({
                          id: order._id,
                          updates: {
                            quantity: order.quantity - 1,
                          },
                        });
                      }
                      if (
                        [OrderStatus.READYTOSERVE, OrderStatus.SERVED].includes(
                          order.status as OrderStatus
                        ) &&
                        !order.discount
                      ) {
                        createOrder({
                          ...order,
                          status: OrderStatus.CANCELLED,
                          quantity: 1,
                          paidQuantity: 0,
                        });
                        updateOrder({
                          id: order._id,
                          updates: {
                            quantity: order.quantity - 1,
                          },
                        });
                      }
                    }}
                  />
                  {/* name and quantity */}
                  <div className="flex w-5/6 gap-1 items-center">
                    <p>{(order.item as MenuItem).name}</p>
                    <h1 className="text-xs">({order.quantity})</h1>
                  </div>
                  {/* increment */}
                  <GoPlusCircle
                    className="w-5 h-5 flex-shrink-0  text-green-500  hover:text-green-800 cursor-pointer focus:outline-none"
                    onClick={() => {
                      if (
                        ![
                          OrderStatus.READYTOSERVE,
                          OrderStatus.SERVED,
                        ].includes(order.status as OrderStatus) &&
                        !order.discount
                      ) {
                        updateOrder({
                          id: order._id,
                          updates: {
                            quantity: order.quantity + 1,
                          },
                        });
                      } else {
                        createOrder({
                          ...order,
                          status: OrderStatus.PENDING,
                          quantity: 1,
                          paidQuantity: 0,
                          createdAt: new Date(),
                          createdBy: user._id,
                        });
                      }
                    }}
                  />
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

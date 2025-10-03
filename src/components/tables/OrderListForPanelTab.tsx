import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMinusCircle } from "react-icons/fi";
import { GoPlusCircle } from "react-icons/go";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { Order, OrderStatus } from "../../types";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetKitchens } from "../../utils/api/menu/kitchen";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useGetTableOrders,
  useOrderMutations,
  useUpdateOrderForCancelMutation,
} from "../../utils/api/order/order";
import { getItem } from "../../utils/getItem";
import { orderBgColor } from "./OrderCard";

type Props = {
  orderStatus: Partial<OrderStatus>[];
  tableId: number;
};
type DisabledButtons = {
  [key: string]: boolean;
};

const OrderListForPanelTab = ({ tableId, orderStatus }: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { updateOrder, createOrder } = useOrderMutations();
  const tableOrders = useGetTableOrders(tableId);
  const [key, setKey] = useState(0);
  const orders = tableOrders?.filter((order) =>
    orderStatus.includes(order.status as OrderStatus)
  );
  const [disabledButtons, setDisabledButtons] = useState<DisabledButtons>({});
  const { mutate: updateOrderCancel } = useUpdateOrderForCancelMutation();
  const orderWaitTime = (order: Order) => {
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - orderTime) / 60000);
  };
  const items = useGetMenuItems();
  const categories = useGetCategories();
  const kitchens = useGetKitchens();
  if (!items || !kitchens || !categories || !user || !orders) {
    return <></>;
  }
  const handleCancel = (order: Order) => {
    if (disabledButtons[order._id]) {
      toast.info(t("Action already processed."));
      return;
    }
    setDisabledButtons((prev) => ({ ...prev, [order._id]: true }));

    updateOrderCancel({
      id: order._id,
      updates: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: user._id,
      },
      tableId: tableId,
    });
  };
  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [tableOrders, items, categories, kitchens, user]);

  return (
    <div key={key} className="  px-2   ">
      {orders?.map((order) => {
        const orderItem = getItem(order?.item, items);
        const orderItemCategory = getItem(orderItem?.category, categories);
        const isOrderConfirmationRequired = getItem(
          orderItemCategory?.kitchen,
          kitchens
        )?.isConfirmationRequired;
        if (!order || order.status === OrderStatus.CANCELLED) return null;
        return (
          <div
            key={order._id}
            className={`flex justify-between text-xs  rounded-lg items-center px-2 py-1 mb-1 ${orderBgColor(
              order
            )} `}
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
                  if (
                    order.paidQuantity > 0 &&
                    !(
                      order.discount &&
                      ((order?.discountAmount &&
                        order?.discountAmount >= order.unitPrice) ||
                        (order?.discountPercentage &&
                          order?.discountPercentage >= 100))
                    )
                  ) {
                    toast.error(t("Paid orders cannot be changed"));
                    return;
                  }
                  let updates = {
                    quantity: order.quantity - 1,
                    paidQuantity: order.paidQuantity,
                  };
                  if (
                    order.discount &&
                    ((order?.discountAmount &&
                      order?.discountAmount >= order.unitPrice) ||
                      (order?.discountPercentage &&
                        order?.discountPercentage >= 100))
                  ) {
                    updates = {
                      quantity: order.quantity - 1,
                      paidQuantity: order.paidQuantity - 1,
                    };
                  }
                  if (
                    ![OrderStatus.READYTOSERVE, OrderStatus.SERVED].includes(
                      order.status as OrderStatus
                    )
                  ) {
                    updateOrder({
                      id: order._id,
                      updates: updates,
                    });
                  }
                  if (
                    [OrderStatus.READYTOSERVE, OrderStatus.SERVED].includes(
                      order.status as OrderStatus
                    )
                  ) {
                    createOrder({
                      ...order,
                      status: OrderStatus.CANCELLED,
                      quantity: 1,
                      paidQuantity: 0,
                    });
                    updateOrder({
                      id: order._id,
                      updates: updates,
                    });
                  }
                }}
              />
              {/* name and quantity */}
              <div className="flex w-5/6 gap-1 items-center">
                <p>{orderItem?.name}</p>
                <h1 className="text-xs">({order.quantity})</h1>
              </div>
              {/* increment */}
              <GoPlusCircle
                className="w-5 h-5 flex-shrink-0  text-green-500  hover:text-green-800 cursor-pointer focus:outline-none"
                onClick={() => {
                  if (order.discount) {
                    toast.error(t("Discounted orders cannot be increased."));
                    return;
                  }
                  if (
                    ![OrderStatus.READYTOSERVE, OrderStatus.SERVED].includes(
                      order.status as OrderStatus
                    ) &&
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
                      status: isOrderConfirmationRequired
                        ? OrderStatus.CONFIRMATIONREQ
                        : OrderStatus.PENDING,
                      quantity: 1,
                      paidQuantity: 0,
                      createdAt: new Date(),
                      createdBy: user._id,
                    });
                  }
                }}
              />
            </div>

            <div className="flex flex-row gap-2 items-center">
              {order.activityTableName &&
                order.activityPlayer &&
                (order.status === OrderStatus.READYTOSERVE ||
                  order.status === OrderStatus.SERVED) && (
                  <p className="text-xs text-gray-700 whitespace-nowrap">
                    M:{order.activityTableName} - O:{order.activityPlayer}
                  </p>
                )}
              {(order.status === OrderStatus.PENDING ||
                order.status === OrderStatus.AUTOSERVED) && (
                <div className="flex flex-row gap-[1px]">
                  <h5 className="text-xs whitespace-nowrap min-w-8">
                    {orderWaitTime(order)} m
                  </h5>
                </div>
              )}
              {(order.paidQuantity === 0 ||
                (order.discount &&
                  ((order?.discountAmount &&
                    order?.discountAmount >= order.unitPrice) ||
                    (order?.discountPercentage &&
                      order?.discountPercentage >= 100)))) && (
                <HiOutlineTrash
                  className="text-red-400 hover:text-red-700 cursor-pointer text-lg px-[0.5px]"
                  onClick={() => handleCancel(order)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderListForPanelTab;

import { Tooltip } from "@material-tailwind/react";
import { HiOutlineTrash } from "react-icons/hi2";
import { MdOutlineOnlinePrediction } from "react-icons/md";
import { Order, OrderDiscountStatus, OrderStatus } from "../../../../types";
import { useGetMenuItems } from "../../../../utils/api/menu/menu-item";
import { useOrderMutations } from "../../../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import { getItem } from "../../../../utils/getItem";
import { orderBgColor } from "../../../tables/OrderCard";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  tableOrders: Order[];
};
const PaidOrders = ({ tableOrders }: Props) => {
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const { updateOrder } = useOrderMutations();
  const items = useGetMenuItems();
  if (!discounts || !items) return null;
  const renderPayment = (order: Order) => {
    if (order?.discount) {
      return (
        <p>
          {order?.discountPercentage
            ? order.unitPrice *
              (100 - (order?.discountPercentage ?? 0)) *
              (1 / 100) *
              order.paidQuantity
            : (
                (order.unitPrice - (order?.discountAmount ?? 0)) *
                order.paidQuantity
              ).toFixed(2)}
          ₺
        </p>
      );
    } else {
      return <p>{(order.unitPrice * order.paidQuantity).toFixed(2)}₺</p>;
    }
  };
  return (
    <div className="flex flex-col overflow-y-auto no-scrollbar h-[180px] sm:h-[190px] lg:h-[210px]">
      <OrderScreenHeader header="Paid Orders" />
      {tableOrders
        ?.sort((a, b) => a.item - b.item)
        ?.map((order) => {
          const isOrderPaid = order.paidQuantity > 1e-6;
          if (!order || !isOrderPaid) return null;
          return (
            <div
              key={order._id}
              className={`flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200 ${
                order.status !== OrderStatus.SERVED && orderBgColor(order, "")
              }`}
            >
              {/* item name,quantity part */}
              <div className="flex flex-row gap-1 text-sm font-medium py-0.2">
                <p>
                  {"("}
                  {(() => {
                    return Number.isInteger(order.paidQuantity)
                      ? order.paidQuantity
                      : order.paidQuantity.toFixed(2);
                  })()}
                  {")"}-
                </p>
                <p>{getItem(order?.item, items)?.name}</p>
                {order?.isOnlinePrice && (
                  <Tooltip
                    content={"online"}
                    placement="top"
                    className={"!z-[999999999999999999999]"}
                  >
                    <div className="relative">
                      <MdOutlineOnlinePrediction className="w-6 h-6" />
                    </div>
                  </Tooltip>
                )}
              </div>
              {order.discount && (
                <div className="text-xs text-white bg-red-600 p-0.5 rounded-md cursor-pointer z-100 flex flex-row gap-1 justify-center items-center">
                  <p>{getItem(order.discount, discounts)?.name}</p>
                </div>
              )}
              {/* buttons */}
              <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
                {renderPayment(order)}
                {order.discount &&
                  ((order?.discountAmount ?? 0) >=
                    order.unitPrice * order.quantity ||
                    (order?.discountPercentage ?? 0) >= 100) && (
                    <HiOutlineTrash
                      className="text-red-600 cursor-pointer text-lg"
                      onClick={() => {
                        updateOrder({
                          id: order._id,
                          updates: {
                            paidQuantity: 0,
                          },
                        });
                      }}
                    />
                  )}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default PaidOrders;

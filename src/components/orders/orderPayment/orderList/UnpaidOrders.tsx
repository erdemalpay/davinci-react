import { useTranslation } from "react-i18next";
import { MdOutlineCancel, MdOutlineTouchApp } from "react-icons/md";
import { useOrderContext } from "../../../../context/Order.context";
import {
  MenuItem,
  Order,
  OrderPayment,
  OrderPaymentItem,
} from "../../../../types";
import {
  useCancelOrderForDiscountMutation,
  useGetGivenDateOrders,
} from "../../../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  orderPayment: OrderPayment;
  collectionsTotalAmount: number;
};

const UnpaidOrders = ({ orderPayment, collectionsTotalAmount }: Props) => {
  const { t } = useTranslation();
  const discounts = useGetOrderDiscounts();
  const { mutate: cancelOrderForDiscount } =
    useCancelOrderForDiscountMutation();
  const orders = useGetGivenDateOrders();
  if (!discounts || !orders) {
    return null;
  }
  const {
    temporaryOrders,
    setPaymentAmount,
    setTemporaryOrders,
    paymentAmount,
  } = useOrderContext();
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
      <OrderScreenHeader header="Unpaid Orders" />
      {/* orders */}
      {orderPayment?.orders?.map((orderPaymentItem) => {
        const order = orders.find(
          (order) => order._id === orderPaymentItem.order
        );
        const isAllPaid =
          orderPaymentItem.paidQuantity === orderPaymentItem.totalQuantity;
        if (!order || isAllPaid) return null;
        const tempOrder = temporaryOrders.find(
          (tempOrder) => tempOrder.order._id === order._id
        );
        const isAllPaidWithTempOrder =
          orderPaymentItem.paidQuantity + (tempOrder?.quantity ?? 0) ===
          orderPaymentItem.totalQuantity;
        if (isAllPaidWithTempOrder) return null;

        const handlePaymentAmount = (
          orderPaymentItem: OrderPaymentItem,
          order: Order
        ) => {
          if (orderPaymentItem?.discount) {
            return (
              order.unitPrice *
              (100 - (orderPaymentItem.discountPercentage ?? 0)) *
              (1 / 100)
            );
          } else {
            return order.unitPrice;
          }
        };
        return (
          <div
            key={order._id}
            className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              const orderPrice = handlePaymentAmount(orderPaymentItem, order);
              if (temporaryOrders.length === 0) {
                setPaymentAmount(
                  String(
                    orderPrice + collectionsTotalAmount >
                      orderPayment.totalAmount - orderPayment.discountAmount
                      ? orderPayment.totalAmount -
                          orderPayment.discountAmount -
                          collectionsTotalAmount
                      : orderPrice
                  )
                );
              } else {
                setPaymentAmount(
                  String(
                    Number(paymentAmount) +
                      orderPrice +
                      collectionsTotalAmount >
                      orderPayment.totalAmount - orderPayment.discountAmount
                      ? orderPayment.totalAmount -
                          orderPayment.discountAmount -
                          collectionsTotalAmount
                      : Number(paymentAmount) + orderPrice
                  )
                );
              }
              if (tempOrder) {
                setTemporaryOrders(
                  temporaryOrders?.map((tempOrder) => {
                    if (tempOrder.order._id === order._id) {
                      return {
                        ...tempOrder,
                        quantity: tempOrder.quantity + 1,
                      };
                    }
                    return tempOrder;
                  })
                );
              } else {
                setTemporaryOrders([
                  ...temporaryOrders,
                  {
                    order,
                    quantity: 1,
                  },
                ]);
              }
            }}
          >
            {/* item name,quantity part */}
            <div className="flex flex-row gap-1 text-sm font-medium py-0.5">
              <p className="mr-auto">
                {"("}
                {orderPaymentItem.totalQuantity -
                  (orderPaymentItem.paidQuantity + (tempOrder?.quantity ?? 0))}
                {")"}-
              </p>

              <div className="flex flex-col gap-1 justify-start mr-auto">
                <p>{(order.item as MenuItem).name}</p>
                {orderPaymentItem.discount && (
                  <div
                    className="text-xs text-white bg-red-600 p-0.5 rounded-md cursor-pointer z-100 flex flex-row gap-1 justify-center items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelOrderForDiscount({
                        orderPaymentId: orderPayment._id,
                        orderId: order._id,
                        cancelQuantity:
                          orderPaymentItem.totalQuantity -
                          orderPaymentItem.paidQuantity,
                      });
                    }}
                  >
                    <p>
                      {
                        discounts.find(
                          (discount) =>
                            discount._id === orderPaymentItem.discount
                        )?.name
                      }
                    </p>
                    <MdOutlineCancel className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
            {/* buttons */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              {orderPaymentItem?.discount && (
                <div className="flex flex-col ml-auto justify-center items-center">
                  <p className="text-xs line-through">
                    {order.unitPrice *
                      (orderPaymentItem.totalQuantity -
                        (orderPaymentItem.paidQuantity +
                          (tempOrder?.quantity ?? 0)))}
                    ₺
                  </p>
                  <p>
                    {order.unitPrice *
                      (100 - (orderPaymentItem.discountPercentage ?? 0)) *
                      (1 / 100) *
                      (orderPaymentItem.totalQuantity -
                        (orderPaymentItem.paidQuantity +
                          (tempOrder?.quantity ?? 0)))}
                    ₺
                  </p>
                </div>
              )}
              {!orderPaymentItem?.discount && (
                <p>
                  {order.unitPrice *
                    (orderPaymentItem.totalQuantity -
                      (orderPaymentItem.paidQuantity +
                        (tempOrder?.quantity ?? 0)))}
                  ₺
                </p>
              )}
              <MdOutlineTouchApp className="cursor-pointer hover:text-red-600 text-lg" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UnpaidOrders;

import { useTranslation } from "react-i18next";
import { MdOutlineTouchApp } from "react-icons/md";
import { useOrderContext } from "../../../../context/Order.context";
import { MenuItem, OrderPayment } from "../../../../types";
import { useGetGivenDateOrders } from "../../../../utils/api/order/order";
import OrderScreenHeader from "./OrderScreenHeader";
type Props = {
  orderPayment: OrderPayment;
  collectionsTotalAmount: number;
};

const UnpaidOrders = ({ orderPayment, collectionsTotalAmount }: Props) => {
  const { t } = useTranslation();
  const orders = useGetGivenDateOrders();
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
        return (
          <div
            key={order._id}
            className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              if (temporaryOrders.length === 0) {
                setPaymentAmount(
                  String(
                    order.unitPrice + collectionsTotalAmount >
                      orderPayment.totalAmount
                      ? orderPayment.totalAmount - collectionsTotalAmount
                      : order.unitPrice
                  )
                );
              } else {
                setPaymentAmount(
                  String(
                    Number(paymentAmount) +
                      order.unitPrice +
                      collectionsTotalAmount >
                      orderPayment.totalAmount
                      ? orderPayment.totalAmount - collectionsTotalAmount
                      : Number(paymentAmount) + order.unitPrice
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
              <p>
                {"("}
                {orderPaymentItem.totalQuantity -
                  (orderPaymentItem.paidQuantity + (tempOrder?.quantity ?? 0))}
                {")"}-
              </p>
              <p>{(order.item as MenuItem).name}</p>
            </div>
            {/* buttons */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              <p>
                {order.unitPrice *
                  (orderPaymentItem.totalQuantity -
                    (orderPaymentItem.paidQuantity +
                      (tempOrder?.quantity ?? 0)))}
                ₺
              </p>
              <MdOutlineTouchApp className="cursor-pointer hover:text-red-600 text-lg" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UnpaidOrders;

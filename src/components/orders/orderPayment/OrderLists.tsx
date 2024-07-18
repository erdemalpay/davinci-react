import { useTranslation } from "react-i18next";
import { MdOutlineTouchApp } from "react-icons/md";
import { useOrderContext } from "../../../context/Order.context";
import { MenuItem, OrderPayment } from "../../../types";
import { useGetTodayOrders } from "../../../utils/api/order/order";

type Props = {
  orderPayment: OrderPayment;
};

const OrderLists = ({ orderPayment }: Props) => {
  const { t } = useTranslation();
  const orders = useGetTodayOrders();
  const {
    setPaymentAmount,
    paymentAmount,
    temporaryOrders,
    setTemporaryOrders,
  } = useOrderContext();

  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Total")}</h1>
        <p>{parseFloat(String(orderPayment.totalAmount)).toFixed(2)}₺</p>
      </div>
      {/* unpaid orders */}
      <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
        {/* header */}
        <div className="relative text-center py-2 mb-2 sticky top-0 bg-white">
          <h1 className="relative z-10 bg-blue-gray-50 px-3 py-1 rounded-full inline-block mx-1">
            {t("Unpaid Orders")}
          </h1>
          <div className="absolute w-full h-[0.2px] bg-blue-gray-200 top-1/2 transform -translate-y-1/2"></div>
        </div>
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
              className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200"
            >
              {/* item name,quantity part */}
              <div className="flex flex-row gap-1 text-sm font-medium py-0.5">
                <p>
                  {"("}
                  {orderPaymentItem.totalQuantity -
                    (orderPaymentItem.paidQuantity +
                      (tempOrder?.quantity ?? 0))}
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
                <MdOutlineTouchApp
                  className="cursor-pointer hover:text-red-600 text-lg"
                  onClick={() => {
                    if (temporaryOrders.length === 0) {
                      setPaymentAmount(String(order.unitPrice));
                    } else {
                      setPaymentAmount(
                        String(Number(paymentAmount) + order.unitPrice)
                      );
                    }
                    if (tempOrder) {
                      setTemporaryOrders(
                        temporaryOrders.map((tempOrder) => {
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
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* paid orders */}
      <div className="flex flex-col h-52 overflow-scroll no-scrollbar ">
        {/* header */}
        <div className="relative text-center py-2 mb-2 sticky top-0 bg-white">
          <h1 className="relative z-10 bg-blue-gray-50 px-3 py-1 rounded-full inline-block mx-1">
            {t("Paid Orders")}
          </h1>
          <div className="absolute w-full h-[0.2px] bg-blue-gray-200 top-1/2 transform -translate-y-1/2"></div>
        </div>
        {orderPayment?.orders?.map((orderPaymentItem) => {
          const order = orders.find(
            (order) => order._id === orderPaymentItem.order
          );
          const isOrderPaid = orderPaymentItem.paidQuantity !== 0;
          if (!order || !isOrderPaid) return null;

          return (
            <div
              key={order._id}
              className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200"
            >
              {/* item name,quantity part */}

              <div className="flex flex-row gap-1 text-sm font-medium py-0.5">
                <p>
                  {"("}
                  {orderPaymentItem.paidQuantity}
                  {")"}-
                </p>
                <p>{(order.item as MenuItem).name}</p>
              </div>

              {/* buttons */}
              <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
                <p>{order.unitPrice * orderPaymentItem.paidQuantity}₺</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderLists;

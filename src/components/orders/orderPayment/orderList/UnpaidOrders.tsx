import { useTranslation } from "react-i18next";
import { MdOutlineTouchApp } from "react-icons/md";
import { useOrderContext } from "../../../../context/Order.context";
import {
  MenuItem,
  OrderCollectionStatus,
  OrderPayment,
} from "../../../../types";
import { useGetGivenDateOrders } from "../../../../utils/api/order/order";
import { useGetOrderCollections } from "../../../../utils/api/order/orderCollection";

type Props = {
  orderPayment: OrderPayment;
};

const UnpaidOrders = ({ orderPayment }: Props) => {
  const { t } = useTranslation();
  const orders = useGetGivenDateOrders();
  const collections = useGetOrderCollections();
  const collectionsTotalAmount = Number(
    orderPayment?.collections?.reduce((acc, collection) => {
      const currentCollection = collections?.find(
        (item) => item._id === collection
      );
      if (
        !currentCollection ||
        currentCollection.status === OrderCollectionStatus.CANCELLED
      ) {
        return acc;
      }
      return acc + (currentCollection?.amount ?? 0);
    }, 0)
  );
  const {
    temporaryOrders,
    setPaymentAmount,
    setTemporaryOrders,
    paymentAmount,
  } = useOrderContext();
  return (
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

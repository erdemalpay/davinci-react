import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaHistory } from "react-icons/fa";
import { PiArrowArcLeftBold } from "react-icons/pi";
import { useOrderContext } from "../../../context/Order.context";
import { MenuItem, OrderPayment } from "../../../types";
import { useGetGivenDateOrders } from "../../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../../utils/api/order/orderDiscount";
import CollectionModal from "./CollectionModal";
import Keypad from "./KeyPad";

type Props = {
  orderPayment: OrderPayment;
  collectionsTotalAmount: number;
};

const OrderTotal = ({ orderPayment, collectionsTotalAmount }: Props) => {
  const { t } = useTranslation();
  const orders = useGetGivenDateOrders();
  const discounts = useGetOrderDiscounts();
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  if (!orders || !orderPayment || !discounts) {
    return null;
  }
  const {
    setPaymentAmount,
    setTemporaryOrders,
    temporaryOrders,
    paymentAmount,
  } = useOrderContext();

  const totalMoneySpend = collectionsTotalAmount + Number(paymentAmount);
  const refundAmount =
    totalMoneySpend -
    (orderPayment?.totalAmount - orderPayment?.discountAmount);
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1  px-2 py-1">
        <div className="flex flex-row gap-1 justify-center items-center">
          <FaHistory
            className="text-red-600 font-semibold cursor-pointer relative"
            onClick={() => {
              setIsCollectionModalOpen(true);
            }}
          />
          <p className="font-semibold">{t("Collection History")}</p>
          {isCollectionModalOpen && (
            <CollectionModal
              setIsCollectionModalOpen={setIsCollectionModalOpen}
              orderCollections={orderPayment?.collections ?? []}
            />
          )}
        </div>
        <p className="text-sm font-semibold">
          {parseFloat(String(collectionsTotalAmount)).toFixed(2) ?? "0.00"} ₺
        </p>
      </div>
      {/* temp orders */}
      <div className="flex flex-col h-48 overflow-scroll no-scrollbar ">
        {orderPayment?.orders?.map((orderPaymentItem) => {
          const order = orders.find(
            (order) => order._id === orderPaymentItem.order
          );
          if (!order) return null;
          const tempOrder = temporaryOrders.find(
            (tempOrder) => tempOrder.order._id === order._id
          );
          const isOrderPaid = (tempOrder?.quantity ?? 0) !== 0;
          if (!isOrderPaid) return null;
          return (
            <div
              key={order._id}
              className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200  hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                if (!tempOrder) return;
                if (tempOrder.quantity === 1) {
                  setTemporaryOrders(
                    temporaryOrders.filter(
                      (tempOrder) => tempOrder.order._id !== order._id
                    )
                  );
                } else {
                  setTemporaryOrders(
                    temporaryOrders.map((tempOrder) => {
                      if (tempOrder.order._id === order._id) {
                        return {
                          ...tempOrder,
                          quantity: tempOrder.quantity - 1,
                        };
                      }
                      return tempOrder;
                    })
                  );
                }
                const newPaymentAmount =
                  Number(paymentAmount) - order.unitPrice;
                setPaymentAmount(
                  String(newPaymentAmount > 0 ? newPaymentAmount : "")
                );
              }}
            >
              {/* item name,quantity part */}
              <div className="flex flex-row gap-1 text-sm font-medium py-0.5">
                <p>
                  {"("}
                  {tempOrder?.quantity ?? 0}
                  {")"}-
                </p>
                <p>{(order.item as MenuItem).name}</p>
              </div>

              {/* buttons */}
              <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
                <p>{order.unitPrice * (tempOrder?.quantity ?? 0)}₺</p>
                {tempOrder && (
                  <PiArrowArcLeftBold className="cursor-pointer text-red-600 text-lg" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* keyPad */}
      <div className="flex flex-col gap-2 mt-2">
        {/* money back&payment amount */}
        <div className="flex flex-row gap-2 justify-between items-center  px-4  font-medium">
          {/* money back */}
          {refundAmount > 0 && (
            <div className="flex flex-row gap-2 justify-center items-center text-white bg-red-600 px-2 py-0.5 rounded-md font-medium text-sm">
              <p>{t("Refund")}</p>
              <p>{parseFloat(String(refundAmount)).toFixed(2)}₺</p>
            </div>
          )}
          <p className="ml-auto">
            {paymentAmount !== "" ? paymentAmount + " ₺" : "0.00" + " ₺"}
          </p>
        </div>

        <Keypad
          orderPayment={orderPayment}
          collectionsTotalAmount={collectionsTotalAmount}
        />
      </div>
    </div>
  );
};

export default OrderTotal;

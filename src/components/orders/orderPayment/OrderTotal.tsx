import { useTranslation } from "react-i18next";
import { PiArrowArcLeftBold } from "react-icons/pi";
import { useOrderContext } from "../../../context/Order.context";
import { MenuItem, Order, Table } from "../../../types";
import { useGetOrderDiscounts } from "../../../utils/api/order/orderDiscount";
import Keypad from "./KeyPad";

type Props = {
  tableOrders: Order[];
  table: Table;
  collectionsTotalAmount: number;
};

const OrderTotal = ({ tableOrders, collectionsTotalAmount, table }: Props) => {
  const { t } = useTranslation();
  const discounts = useGetOrderDiscounts();
  if (!tableOrders || !discounts) {
    return null;
  }
  const {
    setPaymentAmount,
    setTemporaryOrders,
    temporaryOrders,
    paymentAmount,
  } = useOrderContext();
  const discountAmount = tableOrders.reduce((acc, order) => {
    if (!order.discount) {
      return acc;
    }
    const discountValue =
      (order.unitPrice * order.quantity * (order.discountPercentage ?? 0)) /
      100;
    return acc + discountValue;
  }, 0);
  const totalAmount = tableOrders.reduce((acc, order) => {
    return acc + order.unitPrice * order.quantity;
  }, 0);
  const totalMoneySpend = collectionsTotalAmount + Number(paymentAmount);
  const refundAmount = totalMoneySpend - (totalAmount - discountAmount);
  const handlePaymentAmount = (order: Order) => {
    if (order?.discount) {
      return (
        order.unitPrice * (100 - (order.discountPercentage ?? 0)) * (1 / 100)
      );
    } else {
      return order.unitPrice;
    }
  };
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/* temp orders */}
      <div className="flex flex-col h-48 overflow-scroll no-scrollbar ">
        {tableOrders?.map((order) => {
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
                  Number(paymentAmount) - handlePaymentAmount(order);
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
                <p>
                  {handlePaymentAmount(order) * (tempOrder?.quantity ?? 0)}₺
                </p>
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
          tableOrders={tableOrders}
          collectionsTotalAmount={collectionsTotalAmount}
        />
      </div>
    </div>
  );
};

export default OrderTotal;

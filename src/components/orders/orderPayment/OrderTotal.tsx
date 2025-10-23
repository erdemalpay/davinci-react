import { useTranslation } from "react-i18next";
import { PiArrowArcLeftBold } from "react-icons/pi";
import { useOrderContext } from "../../../context/Order.context";
import { Order, Table } from "../../../types";
import { useGetMenuItems } from "../../../utils/api/menu/menu-item";
import { getItem } from "../../../utils/getItem";
import Loading from "../../common/Loading";
import Keypad from "./KeyPad";

type Props = {
  tableOrders: Order[];
  table: Table;
  collectionsTotalAmount: number;
  refundAmount: number;
  unpaidAmount: number;
};

const OrderTotal = ({
  tableOrders,
  collectionsTotalAmount,
  refundAmount,
  unpaidAmount,
}: Props) => {
  const { t } = useTranslation();
  const items = useGetMenuItems();
  if (!tableOrders || !items) {
    return <Loading />;
  }
  const {
    setPaymentAmount,
    setTemporaryOrders,
    temporaryOrders,
    paymentAmount,
  } = useOrderContext();
  const handlePaymentAmount = (order: Order) => {
    if (order?.discount) {
      return (
        (order?.discountPercentage
          ? order.unitPrice *
            (100 - (order?.discountPercentage ?? 0)) *
            (1 / 100)
          : order.unitPrice - (order?.discountAmount ?? 0)) *
        (order?.division ? order.quantity / order.division : 1)
      );
    } else {
      return (
        order.unitPrice *
        (order?.division ? order.quantity / order.division : 1)
      );
    }
  };
  return (
    <div className="flex h-full min-h-0 flex-col justify-between border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/* temp orders */}
      <div className="flex flex-col h-[20rem] overflow-auto">
        {tableOrders
          ?.sort((a, b) => a.item - b.item)
          ?.map((order) => {
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
                  if (tempOrder.quantity === 1 && !order?.division) {
                    setTemporaryOrders(
                      temporaryOrders.filter(
                        (tempOrder) => tempOrder.order._id !== order._id
                      )
                    );
                  } else {
                    setTemporaryOrders(
                      temporaryOrders.map((tempOrder) => {
                        if (tempOrder.order._id === order._id) {
                          const newQuantity = order?.division
                            ? tempOrder.quantity -
                              order.quantity / order.division
                            : tempOrder.quantity -
                              Math.min(tempOrder.quantity, 1);
                          const roundedQuantity =
                            Math.abs(newQuantity) < 1e-6 ? 0 : newQuantity;

                          return {
                            ...tempOrder,
                            quantity: roundedQuantity,
                          };
                        }
                        return tempOrder;
                      })
                    );
                  }

                  const newPaymentAmount =
                    Number(paymentAmount) - handlePaymentAmount(order);
                  if (newPaymentAmount < 1e-6) {
                    setPaymentAmount("");
                    return;
                  }
                  setPaymentAmount(
                    String(newPaymentAmount > 0 ? newPaymentAmount : "")
                  );
                }}
              >
                {/* item name,quantity part */}
                <div className="flex flex-row gap-1 text-sm font-medium py-0.5">
                  <p>
                    {"("}
                    {(() => {
                      return Number.isInteger(tempOrder?.quantity)
                        ? tempOrder?.quantity
                        : tempOrder?.quantity.toFixed(2);
                    })()}
                    {")"}-
                  </p>
                  <p>{getItem(order?.item, items)?.name}</p>
                </div>

                {/* buttons */}
                <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
                  <p>
                    {(
                      (order.discount
                        ? order?.discountPercentage
                          ? order.unitPrice *
                            (100 - (order?.discountPercentage ?? 0)) *
                            (1 / 100)
                          : order.unitPrice - (order?.discountAmount ?? 0)
                        : order.unitPrice) * (tempOrder?.quantity ?? 0)
                    ).toFixed(2)}
                    ₺
                  </p>
                  {tempOrder && (
                    <PiArrowArcLeftBold
                      className="cursor-pointer text-red-600 text-lg hover:text-red-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        const tempOrder = temporaryOrders.find(
                          (tOrder) => tOrder.order._id === order._id
                        );
                        setTemporaryOrders(
                          temporaryOrders.filter(
                            (tOrder) => tOrder.order._id !== order._id
                          )
                        );
                        const newPaymentAmount =
                          Number(paymentAmount) -
                          handlePaymentAmount(order) *
                            ((tempOrder?.quantity ?? 1) *
                              (order?.division
                                ? order.division / order.quantity
                                : 1));
                        if (newPaymentAmount < 1e-6) {
                          setPaymentAmount("");
                          return;
                        }
                        setPaymentAmount(
                          String(newPaymentAmount > 0 ? newPaymentAmount : "")
                        );
                      }}
                    />
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
            {paymentAmount !== ""
              ? parseFloat(String(paymentAmount)).toFixed(2) + " ₺"
              : "0.00" + " ₺"}
          </p>
        </div>

        <Keypad
          tableOrders={tableOrders}
          collectionsTotalAmount={collectionsTotalAmount}
          unpaidAmount={unpaidAmount}
        />
      </div>
    </div>
  );
};

export default OrderTotal;

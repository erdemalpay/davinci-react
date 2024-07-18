import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import bankTransfer from "../../../assets/order/bank_transfer.png";
import cash from "../../../assets/order/cash.png";
import creditCard from "../../../assets/order/credit_card.png";
import { useLocationContext } from "../../../context/Location.context";
import { useOrderContext } from "../../../context/Order.context";
import { OrderCollectionStatus, OrderPayment } from "../../../types";
import { useGetAccountPaymentMethods } from "../../../utils/api/account/paymentMethod";
import {
  useGetOrderCollections,
  useOrderCollectionMutations,
} from "../../../utils/api/order/orderCollection";
import { useOrderPaymentMutations } from "../../../utils/api/order/orderPayment";
type Props = {
  orderPayment: OrderPayment;
};
const OrderPaymentTypes = ({ orderPayment }: Props) => {
  const { t } = useTranslation();
  const paymentTypes = useGetAccountPaymentMethods();
  const { selectedLocationId } = useLocationContext();
  const collections = useGetOrderCollections();
  if (!selectedLocationId || !collections || !paymentTypes) {
    return null;
  }
  const {
    paymentAmount,
    setPaymentAmount,
    temporaryOrders,
    setTemporaryOrders,
  } = useOrderContext();
  const paymentTypeImage = (paymentType: string) => {
    switch (paymentType) {
      case "cash":
        return cash;
      case "credit_card":
        return creditCard;
      case "bank_transfer":
        return bankTransfer;
      default:
        return cash;
    }
  };
  const { updateOrderPayment } = useOrderPaymentMutations();
  const { createOrderCollection } = useOrderCollectionMutations();
  const totalMoneySpend =
    Number(
      orderPayment?.collections?.reduce((acc, collection) => {
        const currentCollection = collections.find(
          (item) => item._id === collection
        );
        if (!currentCollection) {
          return acc;
        }
        return (
          acc +
          (currentCollection?.amount ?? 0) -
          (currentCollection?.refund ?? 0)
        );
      }, 0)
    ) + Number(paymentAmount);

  const isAllItemsPaid = orderPayment?.orders?.every(
    (order) => order.paidQuantity === order.totalQuantity
  );
  const refundAmount = totalMoneySpend - orderPayment?.totalAmount;
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8 ">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Payment Types")}</h1>
      </div>
      {/* payment types */}
      <div className="grid grid-cols-3 gap-2">
        {paymentTypes?.map((paymentType) => (
          <div
            key={paymentType._id}
            onClick={() => {
              // all items are paid
              if (isAllItemsPaid) {
                toast.error(t("There is no order to pay"));
                return;
              }
              // if payment amount is empty
              if (paymentAmount === "" || paymentAmount === "0") {
                toast.error(
                  t("Please enter the amount or select order to pay")
                );
                return;
              }
              // if payment amount is greater than total amount or there are items in the temporary orders
              if (
                temporaryOrders.length !== 0 ||
                totalMoneySpend >= orderPayment.totalAmount
              ) {
                if (totalMoneySpend >= orderPayment.totalAmount) {
                  const newOrders = orderPayment?.orders?.map((order) => {
                    return {
                      order: order.order,
                      paidQuantity: order.totalQuantity,
                      totalQuantity: order.totalQuantity,
                    };
                  });
                  updateOrderPayment({
                    id: orderPayment._id,
                    updates: {
                      orders: newOrders,
                    },
                  });
                } else {
                  const newOrders = orderPayment?.orders?.map((order) => {
                    const temporaryOrder = temporaryOrders.find(
                      (temporaryOrder) =>
                        temporaryOrder.order._id === order.order
                    );
                    if (!temporaryOrder) {
                      return order;
                    }
                    return {
                      order: order.order,
                      paidQuantity:
                        order.paidQuantity + temporaryOrder.quantity,
                      totalQuantity: order.totalQuantity,
                    };
                  });
                  updateOrderPayment({
                    id: orderPayment._id,
                    updates: {
                      orders: newOrders,
                    },
                  });
                }
              }
              createOrderCollection({
                orderPayment: orderPayment._id,
                location: selectedLocationId,
                paymentMethod: paymentType._id,
                amount: Number(paymentAmount),
                refund: refundAmount > 0 ? refundAmount : 0,
                status: OrderCollectionStatus.PAID,
              });
              setPaymentAmount("");
              setTemporaryOrders([]);
            }}
            className="flex flex-col justify-center items-center border border-gray-200 p-2 rounded-md cursor-pointer hover:bg-gray-100 gap-2"
          >
            <img
              className="w-16 h-16"
              src={paymentTypeImage(paymentType._id)}
              alt={paymentType.name}
            />
            <p className="font-medium text-center">{t(paymentType.name)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderPaymentTypes;

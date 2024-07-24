import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../../context/Order.context";
import { Order, OrderPayment } from "../../../types";
import { useGetGivenDateOrders } from "../../../utils/api/order/order";

type Props = {
  orderPayment: OrderPayment;
  collectionsTotalAmount: number;
};
const Keypad = ({ orderPayment, collectionsTotalAmount }: Props) => {
  const {
    setPaymentAmount,
    paymentAmount,
    setTemporaryOrders,
    setIsProductSelectionOpen,
  } = useOrderContext();
  const orders = useGetGivenDateOrders();
  if (!orders) {
    return null;
  }

  const { t } = useTranslation();
  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === ".") {
        if (!paymentAmount.includes(".")) {
          setPaymentAmount(paymentAmount + key);
        }
      } else {
        setPaymentAmount(paymentAmount + key);
      }
      setTemporaryOrders([]);
    },
    [paymentAmount, setPaymentAmount]
  );

  const keys = [
    [
      { key: "7" },
      { key: "8" },
      { key: "9" },
      {
        key: t("All"),
        onClick: () => {
          if (!orderPayment?.orders || !orders) {
            setTemporaryOrders([]);
            return;
          }
          const updatedOrders = orderPayment?.orders
            ?.map((orderPaymentItem) => {
              const order = orders.find(
                (orderItem) => orderItem._id === orderPaymentItem.order
              );
              if (order === undefined) {
                return null;
              }
              return {
                order: order,
                quantity:
                  orderPaymentItem.totalQuantity -
                  orderPaymentItem.paidQuantity,
              };
            })
            ?.filter((order) => order !== null);
          setPaymentAmount(
            (
              (orderPayment?.totalAmount ?? 0) -
              (orderPayment?.discountAmount ?? 0) -
              collectionsTotalAmount
            )?.toString()
          );

          setTemporaryOrders(
            updatedOrders as { order: Order; quantity: number }[]
          );
        },
      },
    ],
    [
      { key: "4" },
      { key: "5" },
      { key: "6" },
      {
        key: t("Discount"),
        onClick: () => {
          setIsProductSelectionOpen(true);
        },
      },
    ],
    [
      { key: "1" },
      { key: "2" },
      { key: "3" },
      {
        key: "C",
        onClick: () => {
          setTemporaryOrders([]);
          setPaymentAmount("");
        },
      },
    ],
    [
      { key: "." },
      { key: "0" },
      {
        key: "←",
        onClick: () => {
          setTemporaryOrders([]);
          setPaymentAmount(paymentAmount.slice(0, -1));
        },
      },
      { key: "" },
    ],
  ];

  return (
    <div className="p-4 grid grid-cols-4 gap-2 ">
      {keys.flat().map((keyItem, index) => {
        if (keyItem.key === "") {
          return <div key={index} className="p-3 rounded-lg min-w-fit"></div>;
        }
        return (
          <button
            key={index}
            className="bg-gray-100 p-3 rounded-lg focus:outline-none hover:bg-gray-200 min-w-fit"
            onClick={() =>
              keyItem.onClick ? keyItem.onClick() : handleKeyPress(keyItem.key)
            }
            aria-label={`Key ${keyItem.key}`}
          >
            {keyItem.key}
          </button>
        );
      })}
    </div>
  );
};

export default Keypad;

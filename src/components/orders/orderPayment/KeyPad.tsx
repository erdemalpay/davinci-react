import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../../context/Order.context";
import { Order } from "../../../types";

type Props = {
  tableOrders: Order[];
  collectionsTotalAmount: number;
};
type KeyItem = {
  key: string;
  onClick?: () => void;
};
const Keypad = ({ tableOrders, collectionsTotalAmount }: Props) => {
  const { t } = useTranslation();
  const {
    setPaymentAmount,
    paymentAmount,
    setTemporaryOrders,
    setIsDiscountScreenOpen,
  } = useOrderContext();
  const [isNumberSelection, setIsNumberSelection] = useState(false);
  const discountAmount = tableOrders?.reduce((acc, order) => {
    if (!order.discount) {
      return acc;
    }
    const discountValue =
      (order.unitPrice * order.quantity * (order?.discountPercentage ?? 0)) /
        100 +
      (order?.discountAmount ?? 0) * order.quantity;
    return acc + discountValue;
  }, 0);
  const totalAmount = tableOrders?.reduce((acc, order) => {
    return acc + order.unitPrice * order.quantity;
  }, 0);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (isNumberSelection) {
        const number = parseInt(key, 10);
        if (!isNaN(number) && number > 0) {
          const rawResult =
            (totalAmount - discountAmount - collectionsTotalAmount) / number;
          const resultAmount = Math.round(rawResult);
          setPaymentAmount(resultAmount.toFixed(2));
          if (
            totalAmount -
              discountAmount -
              collectionsTotalAmount -
              resultAmount <
            1
          ) {
            setPaymentAmount(
              (totalAmount - discountAmount - collectionsTotalAmount).toFixed(2)
            );
          }
        }
        setIsNumberSelection(false);
        setTemporaryOrders([]);
      } else {
        if (key === ".") {
          if (!paymentAmount.includes(".")) {
            setPaymentAmount(paymentAmount + key);
          }
        } else {
          setTemporaryOrders([]);
          setPaymentAmount(paymentAmount + key);
        }
      }
    },
    [
      isNumberSelection,
      paymentAmount,
      setPaymentAmount,
      totalAmount,
      discountAmount,
    ]
  );

  const keys: KeyItem[][] = [
    [
      { key: "7" },
      { key: "8" },
      { key: "9" },
      {
        key: t("All"),
        onClick: () => {
          if (!tableOrders) {
            setTemporaryOrders([]);
            return;
          }
          const updatedOrders = tableOrders
            ?.map((order) => {
              return {
                order: order,
                quantity: order.quantity - order.paidQuantity,
              };
            })
            ?.filter((order) => order !== null);
          setPaymentAmount(
            (
              (totalAmount ?? 0) -
              (discountAmount ?? 0) -
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
          setTemporaryOrders([]);
          setIsDiscountScreenOpen(true);
        },
      },
    ],
    [
      { key: "1" },
      { key: "2" },
      { key: "3" },
      {
        key: "1/n",
        onClick: () => {
          setTemporaryOrders([]);
          setIsNumberSelection(true);
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
      {
        key: "C",
        onClick: () => {
          setTemporaryOrders([]);
          setPaymentAmount("");
        },
      },
    ],
  ];
  const numberKeys: KeyItem[] = [
    { key: "1" },
    { key: "2" },
    { key: "3" },
    { key: "4" },
    { key: "5" },
    { key: "6" },
    { key: "7" },
    { key: "8" },
    { key: "9" },
    {
      key: t("Cancel"),
      onClick() {
        setIsNumberSelection(false);
        setTemporaryOrders([]);
        setPaymentAmount("");
      },
    },
  ];
  return (
    <div
      className={`p-4 grid ${
        isNumberSelection ? "grid-cols-3 " : "grid-cols-4"
      } gap-2`}
    >
      {(isNumberSelection ? numberKeys : keys.flat()).map((keyItem, index) => {
        return (
          <button
            key={index}
            className="bg-gray-100 p-3 rounded-lg focus:outline-none hover:bg-gray-200 min-w-fit"
            onClick={() =>
              keyItem?.onClick
                ? keyItem.onClick?.()
                : handleKeyPress(keyItem.key)
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

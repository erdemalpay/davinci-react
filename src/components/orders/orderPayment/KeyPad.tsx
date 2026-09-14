import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../../context/Order.context";
import { Order } from "../../../types";
import { startSplitPayment } from "../../../utils/splitPayment";
import { GenericButton } from "../../common/GenericButton";

type Props = {
  tableOrders: Order[];
  collectionsTotalAmount: number;
  unpaidAmount: number;
};
type KeyItem = {
  key: string;
  onClick?: () => void;
};
const Keypad = ({
  tableOrders,
  collectionsTotalAmount,
  unpaidAmount,
}: Props) => {
  const { t } = useTranslation();
  const {
    setPaymentAmount,
    paymentAmount,
    setTemporaryOrders,
    setIsDiscountScreenOpen,
    splitPayment,
    setSplitPayment,
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
          const { amount, splitPayment: startedSplitPayment } =
            startSplitPayment(
              totalAmount - discountAmount - collectionsTotalAmount,
              unpaidAmount,
              number
            );
          setPaymentAmount(amount.toFixed(2));
          setSplitPayment(startedSplitPayment);
        }
        setIsNumberSelection(false);
        setTemporaryOrders([]);
      } else {
        setSplitPayment(null);
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
      unpaidAmount,
    ]
  );
  const cancelSplitPayment = () => {
    setSplitPayment(null);
    setPaymentAmount("");
  };

  const keys: KeyItem[][] = [
    [
      { key: "7" },
      { key: "8" },
      { key: "9" },
      {
        key: t("All"),
        onClick: () => {
          setSplitPayment(null);
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
          setPaymentAmount(unpaidAmount?.toString());
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
          setSplitPayment(null);
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
          setSplitPayment(null);
          setTemporaryOrders([]);
          setPaymentAmount(paymentAmount.slice(0, -1));
        },
      },
      {
        key: "C",
        onClick: () => {
          setSplitPayment(null);
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
        setSplitPayment(null);
        setIsNumberSelection(false);
        setTemporaryOrders([]);
        setPaymentAmount("");
      },
    },
  ];
  return (
    <div className="flex flex-col">
      {splitPayment && !isNumberSelection && (
        <div className="flex flex-row justify-between items-center gap-2 mx-4 px-3 py-1 rounded-md bg-blue-50 text-blue-900 text-sm font-medium">
          <p>
            {t("Split payment")} {splitPayment.paid + 1}/{splitPayment.count} -{" "}
            {splitPayment.share.toFixed(2)}₺
          </p>
          <GenericButton
            variant="ghost"
            className="!text-red-500 hover:!text-red-700 text-sm font-medium px-1 py-0"
            onClick={cancelSplitPayment}
          >
            {t("Cancel")}
          </GenericButton>
        </div>
      )}
      <div
        className={`p-4 grid ${
          isNumberSelection ? "grid-cols-3 " : "grid-cols-4"
        } gap-2`}
      >
        {(isNumberSelection ? numberKeys : keys.flat()).map(
          (keyItem, index) => {
            return (
              <GenericButton
                key={index}
                variant="ghost"
                className="!bg-gray-100 p-3 rounded-lg hover:!bg-gray-200 min-w-fit w-full"
                onClick={() =>
                  keyItem?.onClick
                    ? keyItem.onClick?.()
                    : handleKeyPress(keyItem.key)
                }
                aria-label={`Key ${keyItem.key}`}
              >
                {keyItem.key}
              </GenericButton>
            );
          }
        )}
      </div>
    </div>
  );
};

export default Keypad;

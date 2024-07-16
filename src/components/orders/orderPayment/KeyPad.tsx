import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../../context/Order.context";

const Keypad: React.FC = () => {
  const { setPaymentAmount, paymentAmount } = useOrderContext();
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
    },
    [paymentAmount, setPaymentAmount]
  );

  const keys = [
    [
      { key: "7" },
      { key: "8" },
      { key: "9" },
      { key: t("All"), onClick: () => console.log("Tüm") },
    ],
    [
      { key: "4" },
      { key: "5" },
      { key: "6" },
      { key: "1/n", onClick: () => console.log("1/n") },
    ],
    [
      { key: "1" },
      { key: "2" },
      { key: "3" },
      { key: t("Discount"), onClick: () => console.log("indirim") },
    ],
    [
      { key: "." },
      { key: "0" },
      { key: "←", onClick: () => setPaymentAmount(paymentAmount.slice(0, -1)) },
      { key: "C", onClick: () => setPaymentAmount("") },
    ],
  ];

  return (
    <div className="p-4 grid grid-cols-4 gap-2 ">
      {keys.flat().map((keyItem, index) => (
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
      ))}
    </div>
  );
};

export default Keypad;

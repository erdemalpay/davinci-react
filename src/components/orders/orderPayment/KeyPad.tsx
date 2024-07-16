import React from "react";
import { useOrderContext } from "../../../context/Order.context";

const Keypad: React.FC = () => {
  const { setPaymentAmount, paymentAmount } = useOrderContext();
  const keys = [
    [
      { key: "7" },
      { key: "8" },
      { key: "9" },
      { key: "Tüm", onClick: () => console.log("Tüm") },
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
      { key: "indirim", onClick: () => console.log("indirim") },
    ],
    [
      { key: "." },
      { key: "0" },
      { key: "←", onClick: () => setPaymentAmount(paymentAmount.slice(0, -1)) },
      { key: "C", onClick: () => setPaymentAmount("") },
    ],
  ];
  return (
    <div className="p-4 grid grid-cols-4 gap-2">
      {keys.flat().map((keyItem, index) => (
        <button
          key={index}
          className="bg-gray-100 p-3 rounded-lg focus:outline-none  hover:bg-gray-200"
          onClick={() => {
            if (keyItem.onClick) {
              keyItem.onClick();
            } else {
              setPaymentAmount(paymentAmount + keyItem.key);
            }
          }}
        >
          {keyItem.key}
        </button>
      ))}
    </div>
  );
};

export default Keypad;

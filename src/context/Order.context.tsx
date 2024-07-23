import { createContext, PropsWithChildren, useContext, useState } from "react";
import { Order } from "../types";

type OrderContextType = {
  paymentAmount: string;
  setPaymentAmount: (paymentAmount: string) => void;
  isProductSelectionOpen: boolean;
  setIsProductSelectionOpen: (isDiscountSelectionOpen: boolean) => void;
  isDiscountScreenOpen: boolean;
  setIsDiscountScreenOpen: (isDiscountScreenOpen: boolean) => void;
  temporaryOrders: {
    order: Order;
    quantity: number;
  }[];
  setTemporaryOrders: (
    temporaryOrders: {
      order: Order;
      quantity: number;
    }[]
  ) => void;
};

const OrderContext = createContext<OrderContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  paymentAmount: "",
  setPaymentAmount: () => {},
  temporaryOrders: [],
  setTemporaryOrders: () => {},
  isProductSelectionOpen: false,
  setIsProductSelectionOpen: () => {},
  isDiscountScreenOpen: false,
  setIsDiscountScreenOpen: () => {},
});

export const OrderContextProvider = ({ children }: PropsWithChildren) => {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [temporaryOrders, setTemporaryOrders] = useState<
    { order: Order; quantity: number }[]
  >([]);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [isDiscountScreenOpen, setIsDiscountScreenOpen] = useState(false);
  return (
    <OrderContext.Provider
      value={{
        paymentAmount,
        setPaymentAmount,
        temporaryOrders,
        setTemporaryOrders,
        isProductSelectionOpen,
        setIsProductSelectionOpen,
        isDiscountScreenOpen,
        setIsDiscountScreenOpen,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => useContext(OrderContext);

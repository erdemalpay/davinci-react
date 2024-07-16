import { createContext, PropsWithChildren, useContext, useState } from "react";

type OrderContextType = {
  paymentMethod: string;
  setPaymentMethod: (paymentMethod: string) => void;
  paymentAmount: number;
  setPaymentAmount: (paymentAmount: number) => void;
};

const OrderContext = createContext<OrderContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  paymentMethod: "",
  setPaymentMethod: () => {},
  paymentAmount: 0,
  setPaymentAmount: () => {},
});

export const OrderContextProvider = ({ children }: PropsWithChildren) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  return (
    <OrderContext.Provider
      value={{
        paymentMethod,
        setPaymentMethod,
        paymentAmount,
        setPaymentAmount,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => useContext(OrderContext);

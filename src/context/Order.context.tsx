import { createContext, PropsWithChildren, useContext, useState } from "react";

type OrderContextType = {
  paymentMethod: string;
  setPaymentMethod: (paymentMethod: string) => void;
  paymentAmount: string;
  setPaymentAmount: (paymentAmount: string) => void;
};

const OrderContext = createContext<OrderContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  paymentMethod: "",
  setPaymentMethod: () => {},
  paymentAmount: "",
  setPaymentAmount: () => {},
});

export const OrderContextProvider = ({ children }: PropsWithChildren) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
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

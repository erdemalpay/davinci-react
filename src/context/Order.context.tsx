import { createContext, PropsWithChildren, useContext, useState } from "react";
import { Order, OrderDiscount } from "../types";

type OrderContextType = {
  paymentAmount: string;
  setPaymentAmount: (paymentAmount: string) => void;
  isSelectAll: boolean;
  selectedDiscount: OrderDiscount | null;
  setSelectedDiscount: (selectedDiscount: OrderDiscount) => void;
  setIsSelectAll: (isSelectAll: boolean) => void;
  selectedOrders: {
    order: Order;
    totalQuantity: number;
    selectedQuantity: number;
  }[];
  setSelectedOrders: (
    selectedOrders: {
      order: Order;
      totalQuantity: number;
      selectedQuantity: number;
    }[]
  ) => void;
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
  resetOrderContext: () => void;
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
  selectedOrders: [],
  setSelectedOrders: () => {},
  isSelectAll: false,
  setIsSelectAll: () => {},
  selectedDiscount: null,
  setSelectedDiscount: () => {},
  resetOrderContext: () => {},
});

export const OrderContextProvider = ({ children }: PropsWithChildren) => {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [temporaryOrders, setTemporaryOrders] = useState<
    { order: Order; quantity: number }[]
  >([]);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [isDiscountScreenOpen, setIsDiscountScreenOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<
    {
      order: Order;
      totalQuantity: number;
      selectedQuantity: number;
    }[]
  >([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [selectedDiscount, setSelectedDiscount] =
    useState<OrderDiscount | null>(null);

  const resetOrderContext = () => {
    setPaymentAmount("");
    setTemporaryOrders([]);
    setIsProductSelectionOpen(false);
    setIsDiscountScreenOpen(false);
    setSelectedOrders([]);
    setIsSelectAll(false);
    setSelectedDiscount(null);
  };
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
        selectedOrders,
        setSelectedOrders,
        isSelectAll,
        setIsSelectAll,
        selectedDiscount,
        setSelectedDiscount,
        resetOrderContext,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => useContext(OrderContext);

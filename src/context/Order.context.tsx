import { format, startOfMonth } from "date-fns";
import { createContext, PropsWithChildren, useContext, useState } from "react";
import { Order, OrderDiscount } from "../types";
type FormElementsState = {
  [key: string]: any;
};

type OrderContextType = {
  isTransferProductOpen: boolean;
  setIsTransferProductOpen: (isTransferProductOpen: boolean) => void;
  paymentAmount: string;
  setPaymentAmount: (paymentAmount: string) => void;
  isSelectAll: boolean;
  discountNote: string;
  setDiscountNote: (discountNote: string) => void;
  selectedDiscount: OrderDiscount | null;
  setSelectedDiscount: (selectedDiscount: OrderDiscount) => void;
  selectedTableTransfer: number;
  setSelectedTableTransfer: (selectedTableTransfer: number) => void;
  isOrderDivisionActive: boolean;
  setIsOrderDivisionActive: (isOrderDivisionActive: boolean) => void;
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
  isDiscountNoteOpen: boolean;
  setIsDiscountNoteOpen: (isDiscountNoteOpen: boolean) => void;
  isDiscountScreenOpen: boolean;
  setIsDiscountScreenOpen: (isDiscountScreenOpen: boolean) => void;
  isProductDivideOpen: boolean;
  setIsProductDivideOpen: (isProductDivideOpen: boolean) => void;
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
  filterPanelFormElements: FormElementsState;
  setFilterPanelFormElements: (state: FormElementsState) => void;
  filterSummaryFormElements: FormElementsState;
  setFilterSummaryFormElements: (state: FormElementsState) => void;
  isTableSelectOpen: boolean;
  setIsTableSelectOpen: (isTableSelectOpen: boolean) => void;
  resetOrderContext: () => void;
};

const OrderContext = createContext<OrderContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  isOrderDivisionActive: false,
  isTableSelectOpen: false,
  setIsTableSelectOpen: () => {},
  discountNote: "",
  setDiscountNote: () => {},
  setIsOrderDivisionActive: () => {},
  paymentAmount: "",
  setPaymentAmount: () => {},
  temporaryOrders: [],
  setTemporaryOrders: () => {},
  isProductSelectionOpen: false,
  setIsProductSelectionOpen: () => {},
  isDiscountScreenOpen: false,
  setIsDiscountScreenOpen: () => {},
  isDiscountNoteOpen: false,
  setIsDiscountNoteOpen: () => {},
  selectedOrders: [],
  setSelectedOrders: () => {},
  isSelectAll: false,
  setIsSelectAll: () => {},
  isProductDivideOpen: false,
  setIsProductDivideOpen: () => {},
  selectedDiscount: null,
  setSelectedDiscount: () => {},
  resetOrderContext: () => {},
  filterSummaryFormElements: {
    location: "",
    before: format(new Date(), "yyyy-MM-dd"),
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  },
  setFilterSummaryFormElements: () => {},
  filterPanelFormElements: {
    location: "",
    user: "",
    status: "",
    before: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    date: "",
    category: "",
    discount: "",
    paymentMethod: "",
    createdBy: "",
    cancelledBy: "",
    deliveredBy: "",
    preparedBy: "",
  },
  setFilterPanelFormElements: () => {},
  isTransferProductOpen: false,
  setIsTransferProductOpen: () => {},
  selectedTableTransfer: 0,
  setSelectedTableTransfer: () => {},
});

export const OrderContextProvider = ({ children }: PropsWithChildren) => {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [temporaryOrders, setTemporaryOrders] = useState<
    { order: Order; quantity: number }[]
  >([]);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [isDiscountNoteOpen, setIsDiscountNoteOpen] = useState(false);
  const [isDiscountScreenOpen, setIsDiscountScreenOpen] = useState(false);
  const [isOrderDivisionActive, setIsOrderDivisionActive] = useState(false);
  const [isTransferProductOpen, setIsTransferProductOpen] = useState(false);
  const [isTableSelectOpen, setIsTableSelectOpen] = useState(false);
  const [discountNote, setDiscountNote] = useState<string>("");
  const [selectedOrders, setSelectedOrders] = useState<
    {
      order: Order;
      totalQuantity: number;
      selectedQuantity: number;
    }[]
  >([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isProductDivideOpen, setIsProductDivideOpen] = useState(false);
  const [selectedTableTransfer, setSelectedTableTransfer] = useState<number>(0);
  const [selectedDiscount, setSelectedDiscount] =
    useState<OrderDiscount | null>(null);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      user: "",
      status: "",
      before: "",
      after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      date: "",
      category: "",
      discount: "",
      paymentMethod: "",
      createdBy: "",
      cancelledBy: "",
      deliveredBy: "",
      preparedBy: "",
    });
  const [filterSummaryFormElements, setFilterSummaryFormElements] =
    useState<FormElementsState>({
      location: "",
      before: format(new Date(), "yyyy-MM-dd"),
      after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    });
  const resetOrderContext = () => {
    setPaymentAmount("");
    setDiscountNote("");
    setTemporaryOrders([]);
    setIsProductSelectionOpen(false);
    setIsDiscountScreenOpen(false);
    setIsProductDivideOpen(false);
    setSelectedOrders([]);
    setIsSelectAll(false);
    setSelectedDiscount(null);
    setIsOrderDivisionActive(false);
    setIsDiscountNoteOpen(false);
    setIsTransferProductOpen(false);
    setIsTableSelectOpen(false);
    setSelectedTableTransfer(0);
  };
  return (
    <OrderContext.Provider
      value={{
        discountNote,
        setDiscountNote,
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
        filterPanelFormElements,
        setFilterPanelFormElements,
        isProductDivideOpen,
        setIsProductDivideOpen,
        isDiscountNoteOpen,
        setIsDiscountNoteOpen,
        isOrderDivisionActive,
        setIsOrderDivisionActive,
        isTransferProductOpen,
        setIsTransferProductOpen,
        selectedTableTransfer,
        setSelectedTableTransfer,
        isTableSelectOpen,
        setIsTableSelectOpen,
        filterSummaryFormElements,
        setFilterSummaryFormElements,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => useContext(OrderContext);

import { format, startOfMonth } from "date-fns";
import { PropsWithChildren, createContext, useContext, useState } from "react";
import { Order, OrderDiscount } from "../types";
type FormElementsState = {
  [key: string]: any;
};

type OrderContextType = {
  showOrderDataFilters: boolean;
  setShowOrderDataFilters: (showOrderDataFilters: boolean) => void;
  isCollectionModalOpen: boolean;
  setIsCollectionModalOpen: (isCollectionModalOpen: boolean) => void;
  isTransferProductOpen: boolean;
  setIsTransferProductOpen: (isTransferProductOpen: boolean) => void;
  takeawayTableId: number;
  setTakeawayTableId: (takeawayTableId: number) => void;
  isTakeAwayPaymentModalOpen: boolean;
  setIsTakeAwayPaymentModalOpen: (isTakeAwayPaymentModalOpen: boolean) => void;
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
  orderCreateBulk: Partial<Order>[];
  setOrderCreateBulk: (orderCreateBulk: Partial<Order>[]) => void;
  todaysOrderDate: string;
  setTodaysOrderDate: (todaysOrderDate: string) => void;
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
  isTakeAwayOrderModalOpen: boolean;
  setIsTakeAwayOrderModalOpen: (isTakeAwayOrderModalOpen: boolean) => void;
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
  vendorOrderFilterPanelFormElements: FormElementsState;
  setVendorOrderFilterPanelFormElements: (state: FormElementsState) => void;
  filterPanelFormElements: FormElementsState;
  initialFilterPanelFormElements: FormElementsState;
  initialIkasPickUpFilterPanelFormElements: FormElementsState;
  ikasPickUpFilterPanelFormElements: FormElementsState;
  setIkasPickUpFilterPanelFormElements: (state: FormElementsState) => void;
  setFilterPanelFormElements: (state: FormElementsState) => void;
  filterSummaryFormElements: FormElementsState;
  setFilterSummaryFormElements: (state: FormElementsState) => void;
  isTableSelectOpen: boolean;
  setIsTableSelectOpen: (isTableSelectOpen: boolean) => void;
  resetOrderContext: () => void;
  showPickedOrders: boolean;
  setShowPickedOrders: (showPickedOrders: boolean) => void;
  selectedNewOrders: number[];
  setSelectedNewOrders: (selectedNewOrders: number[]) => void;
};

const OrderContext = createContext<OrderContextType>({
  /* eslint-disable @typescript-eslint/no-empty-function */
  vendorOrderFilterPanelFormElements: {
    vendor: "",
    location: [],
  },
  setVendorOrderFilterPanelFormElements: () => {},
  showOrderDataFilters: false,
  setShowOrderDataFilters: () => {},
  isCollectionModalOpen: false,
  setIsCollectionModalOpen: () => {},
  takeawayTableId: 0,
  setTakeawayTableId: () => {},
  isOrderDivisionActive: false,
  isTableSelectOpen: false,
  isTakeAwayOrderModalOpen: false,
  setIsTakeAwayOrderModalOpen: () => {},
  isTakeAwayPaymentModalOpen: false,
  setIsTakeAwayPaymentModalOpen: () => {},
  todaysOrderDate: format(new Date(), "yyyy-MM-dd"),
  setTodaysOrderDate: () => {},
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
  initialFilterPanelFormElements: {
    location: "",
    user: "",
    status: "",
    collectionStatus: "",
    before: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    date: "",
    category: "",
    discount: "",
    paymentMethod: "",
    createdBy: "",
    hour: "",
    cancelledBy: "",
    deliveredBy: "",
    preparedBy: "",
    role: [],
    eliminatedDiscounts: [],
    cancelHour: "",
  },
  initialIkasPickUpFilterPanelFormElements: {
    location: "",
    user: "",
    status: "",
    collectionStatus: "",
    before: "",
    after: `${format(new Date(), "yyyy")}-01-01`,
    date: "",
    category: "",
    discount: "",
    paymentMethod: "",
    createdBy: "",
    hour: "",
    cancelledBy: "",
    deliveredBy: "",
    preparedBy: "",
    role: [],
    eliminatedDiscounts: [],
    cancelHour: "",
  },
  filterPanelFormElements: {
    location: "",
    user: "",
    status: "",
    collectionStatus: "",
    before: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    date: "",
    category: "",
    discount: "",
    hour: "",
    paymentMethod: "",
    createdBy: "",
    cancelledBy: "",
    deliveredBy: "",
    preparedBy: "",
    role: [],
    eliminatedDiscounts: [],
    cancelHour: "",
  },
  ikasPickUpFilterPanelFormElements: {
    location: "",
    user: "",
    status: "",
    collectionStatus: "",
    before: "",
    after: `${format(new Date(), "yyyy")}-01-01`,
    date: "",
    category: "",
    discount: "",
    hour: "",
    paymentMethod: "",
    createdBy: "",
    cancelledBy: "",
    deliveredBy: "",
    preparedBy: "",
    role: [],
    eliminatedDiscounts: [],
    cancelHour: "",
  },
  setIkasPickUpFilterPanelFormElements: () => {},
  setFilterPanelFormElements: () => {},
  isTransferProductOpen: false,
  setIsTransferProductOpen: () => {},
  selectedTableTransfer: 0,
  setSelectedTableTransfer: () => {},
  orderCreateBulk: [],
  setOrderCreateBulk: () => {},
  showPickedOrders: false,
  setShowPickedOrders: () => {},
  selectedNewOrders: [],
  setSelectedNewOrders: () => {},
});

export const OrderContextProvider = ({ children }: PropsWithChildren) => {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [temporaryOrders, setTemporaryOrders] = useState<
    { order: Order; quantity: number }[]
  >([]);
  const [showOrderDataFilters, setShowOrderDataFilters] = useState(false);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [takeawayTableId, setTakeawayTableId] = useState<number>(0);
  const [isTakeAwayOrderModalOpen, setIsTakeAwayOrderModalOpen] =
    useState(false);
  const [isDiscountNoteOpen, setIsDiscountNoteOpen] = useState(false);
  const [isDiscountScreenOpen, setIsDiscountScreenOpen] = useState(false);
  const [isOrderDivisionActive, setIsOrderDivisionActive] = useState(false);
  const [isTransferProductOpen, setIsTransferProductOpen] = useState(false);
  const [isTableSelectOpen, setIsTableSelectOpen] = useState(false);
  const [showPickedOrders, setShowPickedOrders] = useState(false);
  const [
    vendorOrderFilterPanelFormElements,
    setVendorOrderFilterPanelFormElements,
  ] = useState<FormElementsState>({
    vendor: "",
    location: [],
  });
  const [isTakeAwayPaymentModalOpen, setIsTakeAwayPaymentModalOpen] =
    useState(false);
  const [discountNote, setDiscountNote] = useState<string>("");
  const [orderCreateBulk, setOrderCreateBulk] = useState<Partial<Order>[]>([]);
  const [selectedNewOrders, setSelectedNewOrders] = useState<number[]>([]);
  const initialFilterPanelFormElements = {
    location: "",
    user: "",
    status: "",
    collectionStatus: "",
    before: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    date: "",
    category: "",
    discount: "",
    paymentMethod: "",
    createdBy: "",
    cancelledBy: "",
    hour: "",
    deliveredBy: "",
    preparedBy: "",
    role: [],
    eliminatedDiscounts: [],
    cancelHour: "",
  };
  const initialIkasPickUpFilterPanelFormElements = {
    location: "",
    user: "",
    status: "",
    collectionStatus: "",
    before: "",
    after: `${format(new Date(), "yyyy")}-01-01`,
    date: "",
    category: "",
    discount: "",
    paymentMethod: "",
    createdBy: "",
    cancelledBy: "",
    hour: "",
    deliveredBy: "",
    preparedBy: "",
    role: [],
    eliminatedDiscounts: [],
    cancelHour: "",
  };
  const [
    ikasPickUpFilterPanelFormElements,
    setIkasPickUpFilterPanelFormElements,
  ] = useState<FormElementsState>(initialIkasPickUpFilterPanelFormElements);
  const [todaysOrderDate, setTodaysOrderDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
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
    useState<FormElementsState>(initialFilterPanelFormElements);
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
    setIsTakeAwayOrderModalOpen(false);
  };
  return (
    <OrderContext.Provider
      value={{
        vendorOrderFilterPanelFormElements,
        setVendorOrderFilterPanelFormElements,
        showOrderDataFilters,
        setShowOrderDataFilters,
        isCollectionModalOpen,
        setIsCollectionModalOpen,
        takeawayTableId,
        setTakeawayTableId,
        isTakeAwayOrderModalOpen,
        setIsTakeAwayOrderModalOpen,
        isTakeAwayPaymentModalOpen,
        setIsTakeAwayPaymentModalOpen,
        initialFilterPanelFormElements,
        discountNote,
        setDiscountNote,
        todaysOrderDate,
        setTodaysOrderDate,
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
        orderCreateBulk,
        setOrderCreateBulk,
        showPickedOrders,
        setShowPickedOrders,
        ikasPickUpFilterPanelFormElements,
        setIkasPickUpFilterPanelFormElements,
        selectedNewOrders,
        setSelectedNewOrders,
        initialIkasPickUpFilterPanelFormElements,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => useContext(OrderContext);

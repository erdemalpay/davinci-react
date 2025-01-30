import { createContext, PropsWithChildren, useContext, useState } from "react";
import { ColumnType } from "../components/panelComponents/shared/types";
import { CountListOptions, countListOptions } from "../pages/CountLists";
import {
  AccountingPageTabEnum,
  AccountInvoice,
  AccountOverallExpense,
  AccountServiceInvoice,
  ExpensesPageTabEnum,
  MenuItem,
  RowPerPageEnum,
  StocksPageTabEnum,
} from "../types";
import { CreateMultipleExpense } from "../utils/api/account/expense";
import { CreateBulkProductAndMenuItem } from "../utils/api/account/product";

import { useUserContext } from "./User.context";

type GeneralContextType = {
  sortConfigKey: {
    key: string;
    direction: "ascending" | "descending";
  } | null;
  setSortConfigKey: (
    config: {
      key: string;
      direction: "ascending" | "descending";
    } | null
  ) => void;
  showStockFilters: boolean;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  setShowStockFilters: (show: boolean) => void;
  productExpenseForm: Partial<AccountInvoice>;
  errorDataForCreateMultipleExpense: CreateMultipleExpense[];
  setErrorDataForCreateMultipleExpense: (data: CreateMultipleExpense[]) => void;
  errorDataForProductBulkCreation: CreateBulkProductAndMenuItem[];
  setErrorDataForProductBulkCreation: (
    data: CreateBulkProductAndMenuItem[]
  ) => void;
  selectedMenuItem: MenuItem | null;
  setSelectedMenuItem: (item: MenuItem | null) => void;
  setProductExpenseForm: (form: Partial<AccountInvoice>) => void;
  countListOption: CountListOptions;
  setCountListOption: (option: CountListOptions) => void;
  serviceExpenseForm: Partial<AccountServiceInvoice>;
  setServiceExpenseForm: (form: Partial<AccountOverallExpense>) => void;
  allExpenseForm: Partial<AccountOverallExpense>;
  setAllExpenseForm: (form: Partial<AccountInvoice>) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isMenuCategoryLocationEdit: boolean;
  setIsMenuCategoryLocationEdit: (edit: boolean) => void;
  menuActiveTab: number;
  setMenuActiveTab: (tab: number) => void;
  countListActiveTab: number;
  setCountListActiveTab: (tab: number) => void;
  checklistActiveTab: number;
  setChecklistActiveTab: (tab: number) => void;
  panelControlActiveTab: number;
  setPanelControlActiveTab: (tab: number) => void;
  orderDataActiveTab: number;
  setOrderDataActiveTab: (tab: number) => void;
  accountingActiveTab: number;
  ordersActiveTab: number;
  setOrdersActiveTab: (tab: number) => void;
  checkoutActiveTab: number;
  setCheckoutActiveTab: (tab: number) => void;
  setAccountingActiveTab: (tab: number) => void;
  expensesActiveTab: number;
  setExpensesActiveTab: (tab: number) => void;
  stocksActiveTab: number;
  setStocksActiveTab: (tab: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
  expandedRows: { [key: string]: boolean };
  setExpandedRows: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  tableColumns: { [key: string]: ColumnType[] };
  setTableColumns: React.Dispatch<
    React.SetStateAction<{ [key: string]: ColumnType[] }>
  >;
  isSelectionActive: boolean;
  setIsSelectionActive: (isActive: boolean) => void;
  selectedRows: any[];
  setSelectedRows: (rows: any[]) => void;
  resetGeneralContext: () => void;
  isShownInMenu: boolean;
  setIsShownInMenu: (isShown: boolean) => void;
  isMenuShowIkasCategories: boolean;
  setIsMenuShowIkasCategories: (isShown: boolean) => void;
  isMenuLocationEdit: boolean;
  setIsMenuLocationEdit: (isShown: boolean) => void;
};

const GeneralContext = createContext<GeneralContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  isNotificationOpen: false,
  setIsNotificationOpen: () => {},
  isMenuCategoryLocationEdit: false,
  setIsMenuCategoryLocationEdit: () => {},
  showStockFilters: false,
  setShowStockFilters: () => {},
  isMenuShowIkasCategories: false,
  setIsMenuShowIkasCategories: () => {},
  errorDataForCreateMultipleExpense: [],
  setErrorDataForCreateMultipleExpense: () => {},
  selectedMenuItem: null,
  setSelectedMenuItem: () => {},
  sortConfigKey: null,
  setSortConfigKey: () => {},
  countListOption: countListOptions[0],
  setCountListOption: () => {},
  setAccountingActiveTab: () => {},
  accountingActiveTab: AccountingPageTabEnum.EXPENSETYPE,
  checkoutActiveTab: 0,
  setCheckoutActiveTab: () => {},
  ordersActiveTab: 0,
  setOrdersActiveTab: () => {},
  setExpensesActiveTab: () => {},
  expensesActiveTab: ExpensesPageTabEnum.INVOICE,
  setStocksActiveTab: () => {},
  stocksActiveTab: StocksPageTabEnum.STOCK,
  menuActiveTab: 0,
  setMenuActiveTab: () => {},
  countListActiveTab: 0,
  setCountListActiveTab: () => {},
  checklistActiveTab: 0,
  setChecklistActiveTab: () => {},
  panelControlActiveTab: 0,
  setPanelControlActiveTab: () => {},
  setCurrentPage: () => {},
  currentPage: 1,
  searchQuery: "",
  setSearchQuery: () => {},
  rowsPerPage: RowPerPageEnum.FIRST,
  setRowsPerPage: () => {},
  expandedRows: {},
  setExpandedRows: () => {},
  productExpenseForm: {
    date: "",
    product: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    brand: "",
    location: 0,
    vendor: "",
    note: "",
    paymentMethod: "",
    price: 0,
    kdv: 0,
    isStockIncrement: true,
  },
  setProductExpenseForm: () => {},
  serviceExpenseForm: {
    date: "",
    service: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    location: 0,
    vendor: "",
    note: "",
    paymentMethod: "",
    price: 0,
    kdv: 0,
  },
  allExpenseForm: {
    date: "",
    product: "",
    service: "",
    type: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    paymentMethod: "",
    brand: "",
    location: 0,
    vendor: "",
    note: "",
    price: 0,
    kdv: 0,
  },
  setAllExpenseForm: () => {},
  setServiceExpenseForm: () => {},
  orderDataActiveTab: 0,
  setOrderDataActiveTab: () => {},
  tableColumns: {},
  setTableColumns: () => {},
  errorDataForProductBulkCreation: [],
  setErrorDataForProductBulkCreation: () => {},
  isSelectionActive: false,
  setIsSelectionActive: () => {},
  selectedRows: [],
  setSelectedRows: () => {},
  resetGeneralContext: () => {},
  isShownInMenu: false,
  setIsShownInMenu: () => {},
  isMenuLocationEdit: false,
  setIsMenuLocationEdit: () => {},
});

export const GeneralContextProvider = ({ children }: PropsWithChildren) => {
  const { user } = useUserContext();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMenuLocationEdit, setIsMenuLocationEdit] = useState<boolean>(false);
  const [showStockFilters, setShowStockFilters] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isMenuCategoryLocationEdit, setIsMenuCategoryLocationEdit] =
    useState<boolean>(false);
  const [errorDataForProductBulkCreation, setErrorDataForProductBulkCreation] =
    useState<CreateBulkProductAndMenuItem[]>([]);
  const [
    errorDataForCreateMultipleExpense,
    setErrorDataForCreateMultipleExpense,
  ] = useState<CreateMultipleExpense[]>([]);
  const [checklistActiveTab, setChecklistActiveTab] = useState<number>(0);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [isMenuShowIkasCategories, setIsMenuShowIkasCategories] =
    useState<boolean>(false);
  const [isSelectionActive, setIsSelectionActive] = useState<boolean>(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    user?.rowsPerPage ?? RowPerPageEnum.THIRD
  );
  const [tableColumns, setTableColumns] = useState<{
    [key: string]: ColumnType[];
  }>({});
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  useState<boolean>(false);
  const [countListOption, setCountListOption] = useState<CountListOptions>(
    countListOptions[0]
  );
  const [ordersActiveTab, setOrdersActiveTab] = useState<number>(0);
  const [productExpenseForm, setProductExpenseForm] = useState<
    Partial<AccountInvoice>
  >({});
  const [sortConfigKey, setSortConfigKey] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);

  const [serviceExpenseForm, setServiceExpenseForm] = useState<
    Partial<AccountServiceInvoice>
  >({});
  useState<boolean>(false);
  const [expensesActiveTab, setExpensesActiveTab] = useState<number>(
    ExpensesPageTabEnum.INVOICE
  );
  const [stocksActiveTab, setStocksActiveTab] = useState<number>(
    StocksPageTabEnum.STOCK
  );
  const [accountingActiveTab, setAccountingActiveTab] = useState<number>(
    AccountingPageTabEnum.EXPENSETYPE
  );
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [isShownInMenu, setIsShownInMenu] = useState(false);
  const [allExpenseForm, setAllExpenseForm] = useState<
    Partial<AccountOverallExpense>
  >({});
  const [menuActiveTab, setMenuActiveTab] = useState<number>(0);
  const [checkoutActiveTab, setCheckoutActiveTab] = useState<number>(0);
  const [countListActiveTab, setCountListActiveTab] = useState<number>(0);
  const [panelControlActiveTab, setPanelControlActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orderDataActiveTab, setOrderDataActiveTab] = useState<number>(0);
  const resetGeneralContext = () => {
    setIsSelectionActive(false);
    setSelectedRows([]);
    setSortConfigKey(null);
    setExpandedRows({});
    setSearchQuery("");
    setCurrentPage(1);
    setIsNotificationOpen(false);
  };

  return (
    <GeneralContext.Provider
      value={{
        isNotificationOpen,
        setIsNotificationOpen,
        isMenuCategoryLocationEdit,
        setIsMenuCategoryLocationEdit,
        showStockFilters,
        setShowStockFilters,
        isMenuLocationEdit,
        setIsMenuLocationEdit,
        isMenuShowIkasCategories,
        setIsMenuShowIkasCategories,
        errorDataForCreateMultipleExpense,
        setErrorDataForCreateMultipleExpense,
        selectedMenuItem,
        setSelectedMenuItem,
        tableColumns,
        setTableColumns,
        sortConfigKey,
        setSortConfigKey,
        countListOption,
        setCountListOption,
        checkoutActiveTab,
        setCheckoutActiveTab,
        currentPage,
        setCurrentPage,
        countListActiveTab,
        setCountListActiveTab,
        panelControlActiveTab,
        setPanelControlActiveTab,
        menuActiveTab,
        setMenuActiveTab,
        rowsPerPage,
        setRowsPerPage,
        expandedRows,
        stocksActiveTab,
        setStocksActiveTab,
        setExpandedRows,
        searchQuery,
        setSearchQuery,
        accountingActiveTab,
        setAccountingActiveTab,
        expensesActiveTab,
        setExpensesActiveTab,
        productExpenseForm,
        setProductExpenseForm,
        serviceExpenseForm,
        setServiceExpenseForm,
        allExpenseForm,
        setAllExpenseForm,
        orderDataActiveTab,
        setOrderDataActiveTab,
        ordersActiveTab,
        setOrdersActiveTab,
        errorDataForProductBulkCreation,
        setErrorDataForProductBulkCreation,
        isSelectionActive,
        setIsSelectionActive,
        selectedRows,
        setSelectedRows,
        resetGeneralContext,
        isShownInMenu,
        setIsShownInMenu,
        checklistActiveTab,
        setChecklistActiveTab,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneralContext = () => useContext(GeneralContext);

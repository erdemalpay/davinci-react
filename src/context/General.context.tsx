import { createContext, PropsWithChildren, useContext, useState } from "react";
import {
  AccountingPageTabEnum,
  AccountInvoice,
  ExpensesPageTabEnum,
  RowPerPageEnum,
  StocksPageTabEnum,
} from "../types";

type GeneralContextType = {
  productExpenseForm: Partial<AccountInvoice>;
  setProductExpenseForm: (form: Partial<AccountInvoice>) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  menuActiveTab: number;
  setMenuActiveTab: (tab: number) => void;
  accountingActiveTab: number;
  setIsCategoryTabChanged: (isChanged: boolean) => void;
  isCategoryTabChanged: boolean;
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
};

const GeneralContext = createContext<GeneralContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAccountingActiveTab: () => {},
  accountingActiveTab: AccountingPageTabEnum.EXPENSETYPE,
  setExpensesActiveTab: () => {},
  expensesActiveTab: ExpensesPageTabEnum.INVOICE,
  isCategoryTabChanged: false,
  setIsCategoryTabChanged: () => {},
  setStocksActiveTab: () => {},
  stocksActiveTab: StocksPageTabEnum.STOCK,
  menuActiveTab: 0,
  setMenuActiveTab: () => {},
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
    packageType: "",
    brand: "",
    location: "",
    vendor: "",
    note: "",
    price: 0,
    kdv: 0,
  },
  setProductExpenseForm: () => {},
});

export const GeneralContextProvider = ({ children }: PropsWithChildren) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(RowPerPageEnum.FIRST);
  const [productExpenseForm, setProductExpenseForm] = useState<
    Partial<AccountInvoice>
  >({
    date: "",
    product: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    packageType: "",
    brand: "",
    location: "",
    vendor: "",
    note: "",
    price: 0,
    kdv: 0,
  });
  const [isCategoryTabChanged, setIsCategoryTabChanged] =
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
  const [menuActiveTab, setMenuActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  return (
    <GeneralContext.Provider
      value={{
        isCategoryTabChanged,
        setIsCategoryTabChanged,
        currentPage,
        setCurrentPage,
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
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneralContext = () => useContext(GeneralContext);

import { createContext, PropsWithChildren, useContext, useState } from "react";
import {
  AccountFixtureInvoice,
  AccountingPageTabEnum,
  AccountInvoice,
  AccountOverallExpense,
  AccountServiceInvoice,
  ExpensesPageTabEnum,
  RowPerPageEnum,
  StocksPageTabEnum,
} from "../types";

type GeneralContextType = {
  productExpenseForm: Partial<AccountInvoice>;
  setProductExpenseForm: (form: Partial<AccountInvoice>) => void;
  fixtureExpenseForm: Partial<AccountFixtureInvoice>;
  setFixtureExpenseForm: (form: Partial<AccountFixtureInvoice>) => void;
  serviceExpenseForm: Partial<AccountServiceInvoice>;
  setServiceExpenseForm: (form: Partial<AccountOverallExpense>) => void;
  allExpenseForm: Partial<AccountOverallExpense>;
  setAllExpenseForm: (form: Partial<AccountInvoice>) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  menuActiveTab: number;
  setMenuActiveTab: (tab: number) => void;
  countListActiveTab: number;
  setCountListActiveTab: (tab: number) => void;
  accountingActiveTab: number;
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
};

const GeneralContext = createContext<GeneralContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAccountingActiveTab: () => {},
  accountingActiveTab: AccountingPageTabEnum.EXPENSETYPE,
  checkoutActiveTab: 0,
  setCheckoutActiveTab: () => {},
  setExpensesActiveTab: () => {},
  expensesActiveTab: ExpensesPageTabEnum.INVOICE,
  setStocksActiveTab: () => {},
  stocksActiveTab: StocksPageTabEnum.STOCK,
  menuActiveTab: 0,
  setMenuActiveTab: () => {},
  countListActiveTab: 0,
  setCountListActiveTab: () => {},
  setCurrentPage: () => {},
  currentPage: 1,
  searchQuery: "",
  setSearchQuery: () => {},
  rowsPerPage: RowPerPageEnum.FIRST,
  setRowsPerPage: () => {},
  expandedRows: {},
  setExpandedRows: () => {},
  fixtureExpenseForm: {
    date: "",
    fixture: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    brand: "",
    location: "",
    vendor: "",
    note: "",
    price: 0,
    kdv: 0,
  },
  setFixtureExpenseForm: () => {},
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
  serviceExpenseForm: {
    date: "",
    service: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    location: "",
    vendor: "",
    note: "",
    price: 0,
    kdv: 0,
  },
  allExpenseForm: {
    date: "",
    product: "",
    fixture: "",
    service: "",
    type: "",
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
  setAllExpenseForm: () => {},
  setServiceExpenseForm: () => {},
});

export const GeneralContextProvider = ({ children }: PropsWithChildren) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(RowPerPageEnum.FIRST);
  const [productExpenseForm, setProductExpenseForm] = useState<
    Partial<AccountInvoice>
  >({});
  const [fixtureExpenseForm, setFixtureExpenseForm] = useState<
    Partial<AccountFixtureInvoice>
  >({});
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
  const [allExpenseForm, setAllExpenseForm] = useState<
    Partial<AccountOverallExpense>
  >({});
  const [menuActiveTab, setMenuActiveTab] = useState<number>(0);
  const [checkoutActiveTab, setCheckoutActiveTab] = useState<number>(0);
  const [countListActiveTab, setCountListActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  return (
    <GeneralContext.Provider
      value={{
        checkoutActiveTab,
        setCheckoutActiveTab,
        fixtureExpenseForm,
        setFixtureExpenseForm,
        currentPage,
        setCurrentPage,
        countListActiveTab,
        setCountListActiveTab,
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
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneralContext = () => useContext(GeneralContext);

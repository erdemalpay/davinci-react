import { createContext, PropsWithChildren, useContext, useState } from "react";
import { AccountingPageTabEnum, RowPerPageEnum } from "../types";

type GeneralContextType = {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  accountingActiveTab: number;
  setAccountingActiveTab: (tab: number) => void;
  showAccountingConstants: boolean;
  setShowAccountingConstants: (show: boolean) => void;
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
  accountingActiveTab: AccountingPageTabEnum.INVOICE,
  showAccountingConstants: false,
  setShowAccountingConstants: () => {},
  setCurrentPage: () => {},
  currentPage: 1,
  searchQuery: "",
  setSearchQuery: () => {},
  rowsPerPage: RowPerPageEnum.FIRST,
  setRowsPerPage: () => {},
  expandedRows: {},
  setExpandedRows: () => {},
});

export const GeneralContextProvider = ({ children }: PropsWithChildren) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(RowPerPageEnum.FIRST);
  const [accountingActiveTab, setAccountingActiveTab] = useState<number>(
    AccountingPageTabEnum.INVOICE
  );
  const [showAccountingConstants, setShowAccountingConstants] =
    useState<boolean>(true);
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  return (
    <GeneralContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        expandedRows,
        setExpandedRows,
        searchQuery,
        setSearchQuery,
        accountingActiveTab,
        setAccountingActiveTab,
        showAccountingConstants,
        setShowAccountingConstants,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneralContext = () => useContext(GeneralContext);

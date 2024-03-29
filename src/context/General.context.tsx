import { createContext, PropsWithChildren, useContext, useState } from "react";
import { RowPerPageEnum } from "../types";

type GeneralContextType = {
  currentPage: number;
  setCurrentPage: (page: number) => void;
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
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneralContext = () => useContext(GeneralContext);

import { createContext, PropsWithChildren, useContext, useState } from "react";
import { RowPerPageEnum } from "../types";

type GeneralContextType = {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
};

const GeneralContext = createContext<GeneralContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setCurrentPage: () => {},
  currentPage: 1,
  rowsPerPage: RowPerPageEnum.FIRST,
  setRowsPerPage: () => {},
});

export const GeneralContextProvider = ({ children }: PropsWithChildren) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(RowPerPageEnum.FIRST);
  return (
    <GeneralContext.Provider
      value={{ currentPage, setCurrentPage, rowsPerPage, setRowsPerPage }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneralContext = () => useContext(GeneralContext);

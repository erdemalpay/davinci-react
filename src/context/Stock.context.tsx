import { createContext, PropsWithChildren, useContext, useState } from "react";
type FormElementsState = {
  [key: string]: any;
};

type StockContextType = {
  filterPanelFormElements: FormElementsState;
  setFilterPanelFormElements: (state: FormElementsState) => void;
  resetStockContext: () => void;
};

const StockContext = createContext<StockContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  filterPanelFormElements: {
    product: [],
    location: "",
    expenseType: "",
    after: "",
  },
  setFilterPanelFormElements: () => {},
  resetStockContext: () => {},
});
export const StockContextProvider = ({ children }: PropsWithChildren) => {
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      location: "",
      expenseType: "",
      after: "",
      date: "",
    });
  const resetStockContext = () => {
    setFilterPanelFormElements({
      product: [],
      location: "",
      expenseType: "",
      after: filterPanelFormElements.after,
      date: "",
    });
  };
  return (
    <StockContext.Provider
      value={{
        filterPanelFormElements,
        setFilterPanelFormElements,
        resetStockContext,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStockContext = () => useContext(StockContext);

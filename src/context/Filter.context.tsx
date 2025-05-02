import { createContext, PropsWithChildren, useContext, useState } from "react";
type FormElementsState = {
  [key: string]: any;
};

type FilterContextType = {
  filterProductPanelFormElements: FormElementsState;
  setFilterProductPanelFormElements: (state: FormElementsState) => void;
  showProductFilters: boolean;
  setShowProductFilters: (state: boolean) => void;
};

const FilterContext = createContext<FilterContextType>({
  /* eslint-disable @typescript-eslint/no-empty-function */
  filterProductPanelFormElements: {
    brand: "",
    vendor: "",
    expenseType: "",
    name: "",
  },
  setFilterProductPanelFormElements: () => {},
  showProductFilters: false,
  setShowProductFilters: () => {},
});
export const FilterContextProvider = ({ children }: PropsWithChildren) => {
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [filterProductPanelFormElements, setFilterProductPanelFormElements] =
    useState<FormElementsState>({
      brand: "",
      vendor: "",
      expenseType: "",
      name: "",
    });
  return (
    <FilterContext.Provider
      value={{
        filterProductPanelFormElements: filterProductPanelFormElements,
        setFilterProductPanelFormElements: setFilterProductPanelFormElements,
        showProductFilters: showProductFilters,
        setShowProductFilters: setShowProductFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => useContext(FilterContext);

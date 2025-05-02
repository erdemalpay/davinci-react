import { createContext, PropsWithChildren, useContext, useState } from "react";
type FormElementsState = {
  [key: string]: any;
};

type FilterContextType = {
  filterProductPanelFormElements: FormElementsState;
  setFilterProductPanelFormElements: (state: FormElementsState) => void;
  filterServicePanelFormElements: FormElementsState;
  setFilterServicePanelFormElements: (state: FormElementsState) => void;
  showProductFilters: boolean;
  setShowProductFilters: (state: boolean) => void;
  showServiceFilters: boolean;
  setShowServiceFilters: (state: boolean) => void;
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
  showServiceFilters: false,
  setShowServiceFilters: () => {},
  filterServicePanelFormElements: {
    vendor: "",
    expenseType: "",
    name: "",
  },
  setFilterServicePanelFormElements: () => {},
});
export const FilterContextProvider = ({ children }: PropsWithChildren) => {
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [showServiceFilters, setShowServiceFilters] = useState(false);
  const [filterServicePanelFormElements, setFilterServicePanelFormElements] =
    useState<FormElementsState>({
      vendor: "",
      expenseType: "",
      name: "",
    });
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
        showServiceFilters: showServiceFilters,
        setShowServiceFilters: setShowServiceFilters,
        filterServicePanelFormElements: filterServicePanelFormElements,
        setFilterServicePanelFormElements: setFilterServicePanelFormElements,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => useContext(FilterContext);

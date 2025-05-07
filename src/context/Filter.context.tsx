import { format, startOfMonth } from "date-fns";
import { PropsWithChildren, createContext, useContext, useState } from "react";
import { ExpenseTypes, StockHistoryStatusEnum } from "../types";
import { useLocationContext } from "./Location.context";

type FormElementsState = {
  [key: string]: any;
};

type FilterContextType = {
  filterStockPanelFormElements: FormElementsState;
  setFilterStockPanelFormElements: (state: FormElementsState) => void;
  filterProductPanelFormElements: FormElementsState;
  setFilterProductPanelFormElements: (state: FormElementsState) => void;
  filterServicePanelFormElements: FormElementsState;
  setFilterServicePanelFormElements: (state: FormElementsState) => void;
  showProductFilters: boolean;
  setShowProductFilters: (state: boolean) => void;
  showServiceFilters: boolean;
  setShowServiceFilters: (state: boolean) => void;
  showStockFilters: boolean;
  setShowStockFilters: (state: boolean) => void;
  showGameStockFilters: boolean;
  setShowGameStockFilters: (state: boolean) => void;
  filterGameStockPanelFormElements: FormElementsState;
  setFilterGameStockPanelFormElements: (state: FormElementsState) => void;
  showGameStockPrices: boolean;
  setShowGameStockPrices: (state: boolean) => void;
  isGameStockEnableEdit: boolean;
  setIsGameStockEnableEdit: (state: boolean) => void;
  showStockPrices: boolean;
  setShowStockPrices: (state: boolean) => void;
  isStockEnableEdit: boolean;
  setIsStockEnableEdit: (state: boolean) => void;
  showBaseQuantityFilters: boolean;
  setShowBaseQuantityFilters: (state: boolean) => void;
  filterBaseQuantityPanelFormElements: FormElementsState;
  setFilterBaseQuantityPanelFormElements: (state: FormElementsState) => void;
  filterDailySummaryPanelFormElements: FormElementsState;
  setFilterDailySummaryPanelFormElements: (state: FormElementsState) => void;
  showGameStockLocationFilters: boolean;
  setShowGameStockLocationFilters: (state: boolean) => void;
  filtershowGameStockLocationFiltersPanelFormElements: FormElementsState;
  setFiltershowGameStockLocationFiltersPanelFormElements: (
    state: FormElementsState
  ) => void;
  showEnterConsumptionFilters: boolean;
  setShowEnterConsumptionFilters: (state: boolean) => void;
  filterEnterConsumptionPanelFormElements: FormElementsState;
  setFilterEnterConsumptionPanelFormElements: (
    state: FormElementsState
  ) => void;
  showLossProductFilters: boolean;
  setShowLossProductFilters: (state: boolean) => void;
  filterLossProductPanelFormElements: FormElementsState;
  setFilterLossProductPanelFormElements: (state: FormElementsState) => void;
  showProductStockHistoryFilters: boolean;
  setShowProductStockHistoryFilters: (state: boolean) => void;
  filterProductStockHistoryPanelFormElements: FormElementsState;
  setFilterProductStockHistoryPanelFormElements: (
    state: FormElementsState
  ) => void;
  isGameEnableEdit: boolean;
  setIsGameEnableEdit: (state: boolean) => void;
  showLearnedGamesFilters: boolean;
  setShowLearnedGamesFilters: (state: boolean) => void;
  filterLearnedGamesPanelFormElements: FormElementsState;
  setFilterLearnedGamesPanelFormElements: (state: FormElementsState) => void;
  showTablePlayerCountFilters: boolean;
  setShowTablePlayerCountFilters: (state: boolean) => void;
  filterTablePlayerCountPanelFormElements: FormElementsState;
  setFilterTablePlayerCountPanelFormElements: (
    state: FormElementsState
  ) => void;
  showVisitScheduleOverviewFilters: boolean;
  setShowVisitScheduleOverviewFilters: (state: boolean) => void;
  filterVisitScheduleOverviewPanelFormElements: FormElementsState;
  setFilterVisitScheduleOverviewPanelFormElements: (
    state: FormElementsState
  ) => void;
  showAllVisitsFilters: boolean;
  setShowAllVisitsFilters: (state: boolean) => void;
  filterAllVisitsPanelFormElements: FormElementsState;
  setFilterAllVisitsPanelFormElements: (state: FormElementsState) => void;
  isChefAssignOpen: boolean;
  setIsChefAssignOpen: (state: boolean) => void;
  showShiftsFilters: boolean;
  setShowShiftsFilters: (state: boolean) => void;
  isShiftsEnableEdit: boolean;
  setIsShiftsEnableEdit: (state: boolean) => void;
  isInvoiceEnableEdit: boolean;
  setIsInvoiceEnableEdit: (state: boolean) => void;
  showInvoieFilters: boolean;
  setShowInvoieFilters: (state: boolean) => void;
  filterPanelInvoiceFormElements: FormElementsState;
  setFilterPanelInvoiceFormElements: (state: FormElementsState) => void;
  isServiceInvoiceEnableEdit: boolean;
  setIsServiceInvoiceEnableEdit: (state: boolean) => void;
  showServiceInvoiceFilters: boolean;
  setShowServiceInvoiceFilters: (state: boolean) => void;
  filterServiceInvoicePanelFormElements: FormElementsState;
  setFilterServiceInvoicePanelFormElements: (state: FormElementsState) => void;
  showAllExpensesFilters: boolean;
  setShowAllExpensesFilters: (state: boolean) => void;
  filterAllExpensesPanelFormElements: FormElementsState;
  setFilterAllExpensesPanelFormElements: (state: FormElementsState) => void;
  showInactiveShifts: boolean;
  setShowInactiveShifts: (state: boolean) => void;
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
  showStockFilters: false,
  setShowStockFilters: () => {},
  filterStockPanelFormElements: {
    product: [],
    location: "",
    expenseType: "",
    after: "",
    date: "",
  },
  setFilterStockPanelFormElements: () => {},
  showGameStockFilters: false,
  setShowGameStockFilters: () => {},
  filterGameStockPanelFormElements: {
    product: [],
    location: "",
  },
  setFilterGameStockPanelFormElements: () => {},
  showGameStockPrices: false,
  setShowGameStockPrices: () => {},
  isGameStockEnableEdit: false,
  setIsGameStockEnableEdit: () => {},
  showStockPrices: false,
  setShowStockPrices: () => {},
  isStockEnableEdit: false,
  setIsStockEnableEdit: () => {},
  showBaseQuantityFilters: false,
  setShowBaseQuantityFilters: () => {},
  filterBaseQuantityPanelFormElements: {
    expenseType: [],
    vendor: [],
  },
  setFilterBaseQuantityPanelFormElements: () => {},
  showGameStockLocationFilters: false,
  setShowGameStockLocationFilters: () => {},
  filtershowGameStockLocationFiltersPanelFormElements: {
    product: [],
    bahceliMin: "",
    bahceliMax: "",
    neoramaMin: "",
    neoramaMax: "",
    amazonMin: "",
    amazonMax: "",
    neoDepoMin: "",
    neoDepoMax: "",
  },
  setFiltershowGameStockLocationFiltersPanelFormElements: () => {},
  showEnterConsumptionFilters: false,
  setShowEnterConsumptionFilters: () => {},
  filterEnterConsumptionPanelFormElements: {
    product: [],
    expenseType: "",
    location: "",
    status: StockHistoryStatusEnum.CONSUMPTION,
    before: "",
    after: "",
    sort: "",
    asc: 1,
    vendor: "",
    brand: "",
  },
  setFilterEnterConsumptionPanelFormElements: () => {},
  showLossProductFilters: false,
  setShowLossProductFilters: () => {},
  filterLossProductPanelFormElements: {
    product: [],
    expenseType: "",
    location: "",
    status: StockHistoryStatusEnum.LOSSPRODUCT,
    before: "",
    after: "",
    sort: "",
    asc: 1,
    vendor: "",
    brand: "",
  },
  setFilterLossProductPanelFormElements: () => {},
  showProductStockHistoryFilters: false,
  setShowProductStockHistoryFilters: () => {},
  filterProductStockHistoryPanelFormElements: {
    product: [],
    expenseType: "",
    location: "",
    status: "",
    before: "",
    after: "",
    sort: "",
    asc: 1,
    vendor: "",
    brand: "",
  },
  setFilterProductStockHistoryPanelFormElements: () => {},
  isGameEnableEdit: false,
  setIsGameEnableEdit: () => {},
  showLearnedGamesFilters: false,
  setShowLearnedGamesFilters: () => {},
  filterLearnedGamesPanelFormElements: {
    user: "",
    game: "",
    after: "",
    before: "",
  },
  setFilterLearnedGamesPanelFormElements: () => {},
  showTablePlayerCountFilters: false,
  setShowTablePlayerCountFilters: () => {},
  filterTablePlayerCountPanelFormElements: {
    monthYear: "",
  },
  setFilterTablePlayerCountPanelFormElements: () => {},
  showVisitScheduleOverviewFilters: false,
  setShowVisitScheduleOverviewFilters: () => {},
  filterVisitScheduleOverviewPanelFormElements: {
    date: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    before: "",
    user: "",
    location: "",
  },
  setFilterVisitScheduleOverviewPanelFormElements: () => {},
  showAllVisitsFilters: false,
  setShowAllVisitsFilters: () => {},
  filterAllVisitsPanelFormElements: {
    date: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    before: "",
    user: "",
    location: "",
  },
  setFilterAllVisitsPanelFormElements: () => {},
  isChefAssignOpen: false,
  setIsChefAssignOpen: () => {},
  showShiftsFilters: false,
  setShowShiftsFilters: () => {},
  isShiftsEnableEdit: false,
  setIsShiftsEnableEdit: () => {},
  isInvoiceEnableEdit: false,
  setIsInvoiceEnableEdit: () => {},
  showInvoieFilters: false,
  setShowInvoieFilters: () => {},
  filterPanelInvoiceFormElements: {
    product: [],
    service: [],
    type: ExpenseTypes.STOCKABLE,
    vendor: "",
    brand: "",
    expenseType: "",
    paymentMethod: "",
    location: "",
    date: "",
    before: "",
    after: "",
    sort: "",
    asc: 1,
    search: "",
  },
  setFilterPanelInvoiceFormElements: () => {},
  isServiceInvoiceEnableEdit: false,
  setIsServiceInvoiceEnableEdit: () => {},
  showServiceInvoiceFilters: false,
  setShowServiceInvoiceFilters: () => {},
  filterServiceInvoicePanelFormElements: {
    product: [],
    service: [],
    type: ExpenseTypes.NONSTOCKABLE,
    vendor: "",
    brand: "",
    expenseType: "",
    paymentMethod: "",
    location: "",
    date: "",
    before: "",
    after: "",
    sort: "",
    asc: 1,
    search: "",
  },
  setFilterServiceInvoicePanelFormElements: () => {},
  showAllExpensesFilters: false,
  setShowAllExpensesFilters: () => {},
  filterAllExpensesPanelFormElements: {
    product: [],
    service: [],
    type: "",
    vendor: "",
    brand: "",
    expenseType: "",
    paymentMethod: "",
    location: "",
    date: "",
    before: "",
    after: "",
    sort: "",
    asc: 1,
    search: "",
  },
  setFilterAllExpensesPanelFormElements: () => {},
  showInactiveShifts: false,
  setShowInactiveShifts: () => {},
  filterDailySummaryPanelFormElements: {
    location: "",
    date: "",
  },
  setFilterDailySummaryPanelFormElements: () => {},
});
export const FilterContextProvider = ({ children }: PropsWithChildren) => {
  const { selectedLocationId } = useLocationContext();
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [showServiceFilters, setShowServiceFilters] = useState(false);
  const [showStockFilters, setShowStockFilters] = useState(false);
  const [showGameStockFilters, setShowGameStockFilters] = useState(false);
  const [showGameStockPrices, setShowGameStockPrices] = useState(false);
  const [isGameStockEnableEdit, setIsGameStockEnableEdit] = useState(false);
  const [showStockPrices, setShowStockPrices] = useState(false);
  const [isStockEnableEdit, setIsStockEnableEdit] = useState(false);
  const [showBaseQuantityFilters, setShowBaseQuantityFilters] = useState(false);
  const [showLossProductFilters, setShowLossProductFilters] = useState(false);
  const [isGameEnableEdit, setIsGameEnableEdit] = useState(false);
  const [showLearnedGamesFilters, setShowLearnedGamesFilters] = useState(false);
  const [showAllVisitsFilters, setShowAllVisitsFilters] = useState(false);
  const [showShiftsFilters, setShowShiftsFilters] = useState(false);
  const [isShiftsEnableEdit, setIsShiftsEnableEdit] = useState(false);
  const [isChefAssignOpen, setIsChefAssignOpen] = useState(false);

  const [showServiceInvoiceFilters, setShowServiceInvoiceFilters] =
    useState(false);
  const [isServiceInvoiceEnableEdit, setIsServiceInvoiceEnableEdit] =
    useState(false);
  const [showInactiveShifts, setShowInactiveShifts] = useState(false);
  const [
    showVisitScheduleOverviewFilters,
    setShowVisitScheduleOverviewFilters,
  ] = useState(false);
  const [showInvoiceFilters, setShowInvoiceFilters] = useState(false);
  const [isInvoiceEnableEdit, setIsInvoiceEnableEdit] = useState(false);
  const [showAllExpensesFilters, setShowAllExpensesFilters] = useState(false);
  const [
    filterDailySummaryPanelFormElements,
    setFilterDailySummaryPanelFormElements,
  ] = useState<FormElementsState>({
    location: selectedLocationId,
    date: format(new Date(), "yyyy-MM-dd"),
  });
  const [
    filterAllVisitsPanelFormElements,
    setFilterAllVisitsPanelFormElements,
  ] = useState<FormElementsState>({
    date: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    before: "",
    user: "",
    location: "",
  });
  const [
    filterAllExpensesPanelFormElements,
    setFilterAllExpensesPanelFormElements,
  ] = useState<FormElementsState>({
    product: [],
    service: [],
    type: "",
    vendor: "",
    brand: "",
    expenseType: "",
    paymentMethod: "",
    location: "",
    date: "",
    before: "",
    after: "",
    sort: "",
    asc: 1,
    search: "",
  });
  const [
    filterServiceInvoicePanelFormElements,
    setFilterServiceInvoicePanelFormElements,
  ] = useState<FormElementsState>({
    product: [],
    service: [],
    type: ExpenseTypes.NONSTOCKABLE,
    vendor: "",
    brand: "",
    expenseType: "",
    paymentMethod: "",
    location: "",
    date: "",
    before: "",
    after: "",
    sort: "",
    asc: 1,
    search: "",
  });
  const [filterPanelInvoiceFormElements, setFilterPanelInvoiceFormElements] =
    useState<FormElementsState>({
      product: [],
      service: [],
      type: ExpenseTypes.STOCKABLE,
      vendor: "",
      brand: "",
      expenseType: "",
      paymentMethod: "",
      location: "",
      date: "",
      before: "",
      after: "",
      sort: "",
      asc: 1,
      search: "",
    });

  const [
    filterVisitScheduleOverviewPanelFormElements,
    setFilterVisitScheduleOverviewPanelFormElements,
  ] = useState<FormElementsState>({
    date: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    before: "",
    user: "",
    location: "",
  });
  const [showTablePlayerCountFilters, setShowTablePlayerCountFilters] =
    useState(false);
  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = now.getFullYear().toString();
  const [
    filterTablePlayerCountPanelFormElements,
    setFilterTablePlayerCountPanelFormElements,
  ] = useState<FormElementsState>({
    monthYear: currentMonth + "-" + currentYear,
  });
  const [
    filterLearnedGamesPanelFormElements,
    setFilterLearnedGamesPanelFormElements,
  ] = useState<FormElementsState>({
    user: "",
    game: "",
    after: "",
    before: "",
  });
  const [
    filterProductStockHistoryPanelFormElements,
    setFilterProductStockHistoryPanelFormElements,
  ] = useState<FormElementsState>({
    product: [],
    expenseType: "",
    location: "",
    status: "",
    before: "",
    after: "",
    sort: "",
    asc: 1,
    vendor: "",
    brand: "",
  });
  const [showProductStockHistoryFilters, setShowProductStockHistoryFilters] =
    useState(false);
  const [showEnterConsumptionFilters, setShowEnterConsumptionFilters] =
    useState(false);
  const [showGameStockLocationFilters, setShowGameStockLocationFilters] =
    useState(false);
  const [
    filterLossProductPanelFormElements,
    setFilterLossProductPanelFormElements,
  ] = useState<FormElementsState>({
    product: [],
    expenseType: "",
    location: selectedLocationId,
    status: StockHistoryStatusEnum.LOSSPRODUCT,
    before: "",
    after: "",
    sort: "",
    asc: 1,
    vendor: "",
    brand: "",
  });
  const [
    filtershowGameStockLocationFiltersPanelFormElements,
    setFiltershowGameStockLocationFiltersPanelFormElements,
  ] = useState<FormElementsState>({
    product: [],
    bahceliMin: "",
    bahceliMax: "",
    neoramaMin: "",
    neoramaMax: "",
    amazonMin: "",
    amazonMax: "",
    neoDepoMin: "",
    neoDepoMax: "",
  });
  const [
    filterEnterConsumptionPanelFormElements,
    setFilterEnterConsumptionPanelFormElements,
  ] = useState<FormElementsState>({
    product: [],
    expenseType: "",
    location: selectedLocationId,
    status: StockHistoryStatusEnum.CONSUMPTION,
    before: "",
    after: "",
    sort: "",
    asc: 1,
    vendor: "",
    brand: "",
  });
  const [
    filterBaseQuantityPanelFormElements,
    setFilterBaseQuantityPanelFormElements,
  ] = useState<FormElementsState>({
    expenseType: [],
    vendor: [],
  });
  const [filterStockPanelFormElements, setFilterStockPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      location: "",
      expenseType: "",
      after: "",
      date: "",
    });
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
  const [
    filterGameStockPanelFormElements,
    setFilterGameStockPanelFormElements,
  ] = useState<FormElementsState>({ product: [], location: "" });
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
        showStockFilters: showStockFilters,
        setShowStockFilters: setShowStockFilters,
        filterStockPanelFormElements: filterStockPanelFormElements,
        setFilterStockPanelFormElements: setFilterStockPanelFormElements,
        showGameStockFilters: showGameStockFilters,
        setShowGameStockFilters: setShowGameStockFilters,
        filterGameStockPanelFormElements: filterGameStockPanelFormElements,
        setFilterGameStockPanelFormElements:
          setFilterGameStockPanelFormElements,
        showGameStockPrices: showGameStockPrices,
        setShowGameStockPrices: setShowGameStockPrices,
        isGameStockEnableEdit: isGameStockEnableEdit,
        setIsGameStockEnableEdit: setIsGameStockEnableEdit,
        showStockPrices: showStockPrices,
        setShowStockPrices: setShowStockPrices,
        isStockEnableEdit: isStockEnableEdit,
        setIsStockEnableEdit: setIsStockEnableEdit,
        showBaseQuantityFilters: showBaseQuantityFilters,
        setShowBaseQuantityFilters: setShowBaseQuantityFilters,
        filterBaseQuantityPanelFormElements:
          filterBaseQuantityPanelFormElements,
        setFilterBaseQuantityPanelFormElements:
          setFilterBaseQuantityPanelFormElements,
        showGameStockLocationFilters: showGameStockLocationFilters,
        setShowGameStockLocationFilters: setShowGameStockLocationFilters,
        filtershowGameStockLocationFiltersPanelFormElements:
          filtershowGameStockLocationFiltersPanelFormElements,
        setFiltershowGameStockLocationFiltersPanelFormElements:
          setFiltershowGameStockLocationFiltersPanelFormElements,
        showEnterConsumptionFilters: showEnterConsumptionFilters,
        setShowEnterConsumptionFilters: setShowEnterConsumptionFilters,
        filterEnterConsumptionPanelFormElements:
          filterEnterConsumptionPanelFormElements,
        setFilterEnterConsumptionPanelFormElements:
          setFilterEnterConsumptionPanelFormElements,
        showLossProductFilters: showLossProductFilters,
        setShowLossProductFilters: setShowLossProductFilters,
        filterLossProductPanelFormElements: filterLossProductPanelFormElements,
        setFilterLossProductPanelFormElements:
          setFilterLossProductPanelFormElements,
        showProductStockHistoryFilters: showProductStockHistoryFilters,
        setShowProductStockHistoryFilters: setShowProductStockHistoryFilters,
        filterProductStockHistoryPanelFormElements:
          filterProductStockHistoryPanelFormElements,
        setFilterProductStockHistoryPanelFormElements:
          setFilterProductStockHistoryPanelFormElements,
        isGameEnableEdit: isGameEnableEdit,
        setIsGameEnableEdit: setIsGameEnableEdit,
        showLearnedGamesFilters: showLearnedGamesFilters,
        setShowLearnedGamesFilters: setShowLearnedGamesFilters,
        filterLearnedGamesPanelFormElements:
          filterLearnedGamesPanelFormElements,
        setFilterLearnedGamesPanelFormElements:
          setFilterLearnedGamesPanelFormElements,
        showTablePlayerCountFilters: showTablePlayerCountFilters,
        setShowTablePlayerCountFilters: setShowTablePlayerCountFilters,
        filterTablePlayerCountPanelFormElements:
          filterTablePlayerCountPanelFormElements,
        setFilterTablePlayerCountPanelFormElements:
          setFilterTablePlayerCountPanelFormElements,
        showVisitScheduleOverviewFilters: showVisitScheduleOverviewFilters,
        setShowVisitScheduleOverviewFilters:
          setShowVisitScheduleOverviewFilters,
        filterVisitScheduleOverviewPanelFormElements:
          filterVisitScheduleOverviewPanelFormElements,
        setFilterVisitScheduleOverviewPanelFormElements:
          setFilterVisitScheduleOverviewPanelFormElements,
        showAllVisitsFilters: showAllVisitsFilters,
        setShowAllVisitsFilters: setShowAllVisitsFilters,
        filterAllVisitsPanelFormElements: filterAllVisitsPanelFormElements,
        setFilterAllVisitsPanelFormElements:
          setFilterAllVisitsPanelFormElements,
        isChefAssignOpen: isChefAssignOpen,
        setIsChefAssignOpen: setIsChefAssignOpen,
        showShiftsFilters: showShiftsFilters,
        setShowShiftsFilters: setShowShiftsFilters,
        isShiftsEnableEdit: isShiftsEnableEdit,
        setIsShiftsEnableEdit: setIsShiftsEnableEdit,
        isInvoiceEnableEdit: isInvoiceEnableEdit,
        setIsInvoiceEnableEdit: setIsInvoiceEnableEdit,
        showInvoieFilters: showInvoiceFilters,
        setShowInvoieFilters: setShowInvoiceFilters,
        filterPanelInvoiceFormElements: filterPanelInvoiceFormElements,
        setFilterPanelInvoiceFormElements: setFilterPanelInvoiceFormElements,
        isServiceInvoiceEnableEdit: isServiceInvoiceEnableEdit,
        setIsServiceInvoiceEnableEdit: setIsServiceInvoiceEnableEdit,
        showServiceInvoiceFilters: showServiceInvoiceFilters,
        setShowServiceInvoiceFilters: setShowServiceInvoiceFilters,
        filterServiceInvoicePanelFormElements:
          filterServiceInvoicePanelFormElements,
        setFilterServiceInvoicePanelFormElements:
          setFilterServiceInvoicePanelFormElements,
        showAllExpensesFilters: showAllExpensesFilters,
        setShowAllExpensesFilters: setShowAllExpensesFilters,
        filterAllExpensesPanelFormElements: filterAllExpensesPanelFormElements,
        setFilterAllExpensesPanelFormElements:
          setFilterAllExpensesPanelFormElements,
        showInactiveShifts: showInactiveShifts,
        setShowInactiveShifts: setShowInactiveShifts,
        filterDailySummaryPanelFormElements:
          filterDailySummaryPanelFormElements,
        setFilterDailySummaryPanelFormElements:
          setFilterDailySummaryPanelFormElements,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => useContext(FilterContext);

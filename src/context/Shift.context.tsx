import { endOfWeek, format, startOfWeek } from "date-fns";
import { PropsWithChildren, createContext, useContext, useState } from "react";
import { useLocationContext } from "./Location.context";

type FormElementsState = {
  [key: string]: any;
};

type ShiftContextType = {
  filterPanelFormElements: FormElementsState;
  initialFilterPanelFormElements: FormElementsState;
  setFilterPanelFormElements: (state: FormElementsState) => void;
};

const ShiftContext = createContext<ShiftContextType>({
  /* eslint-disable @typescript-eslint/no-empty-function */
  filterPanelFormElements: {
    location: "",
    after: "",
    before: "",
    user: "",
    date: "",
  },
  initialFilterPanelFormElements: {},
  setFilterPanelFormElements: () => {},
});

export const ShiftContextProvider = ({ children }: PropsWithChildren) => {
  const { selectedLocationId } = useLocationContext();
  const initialFilterPanelFormElements = {
    location: selectedLocationId,
    after: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    before: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    user: "",
    date: "",
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  return (
    <ShiftContext.Provider
      value={{
        filterPanelFormElements,
        setFilterPanelFormElements,
        initialFilterPanelFormElements,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export const useShiftContext = () => useContext(ShiftContext);

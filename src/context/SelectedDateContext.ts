import { createContext } from "react";

type SelectedDateContextType = {
  setSelectedDate: (date: string) => void;
  selectedDate?: string;
};

export const SelectedDateContext = createContext<SelectedDateContextType>({
  setSelectedDate: () => {},
  selectedDate: undefined,
});

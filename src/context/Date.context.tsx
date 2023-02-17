import { createContext, PropsWithChildren, useContext, useState } from "react";
import { formatDate } from "../utils/dateUtil";

type DateContextType = {
  setSelectedDate: (date: string) => void;
  selectedDate?: string;
};

const DateContext = createContext<DateContextType>({
  setSelectedDate: () => {},
  selectedDate: undefined,
});

export const DateContextProvider = ({ children }: PropsWithChildren) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDate(new Date())
  );

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </DateContext.Provider>
  );
};

export const useDateContext = () => useContext(DateContext);

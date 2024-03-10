import {
  Locale,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getYear,
  startOfMonth,
  subMonths,
} from "date-fns";
import React, { ReactNode, useContext } from "react";

type CalendarState = {
  days: Date[];
  currentMonth: Date;
  locale?: Locale;
  onCurrentMonthChange: (date: Date) => void;
};

const MonthlyCalendarContext = React.createContext<CalendarState>(
  {} as CalendarState
);

export const useMonthlyCalendar = () => useContext(MonthlyCalendarContext);

type Props = {
  locale?: Locale;
  children: ReactNode;
  currentMonth: Date;
  onCurrentMonthChange: (date: Date) => void;
};

export const MonthlyCalendar = ({
  locale,
  currentMonth,
  onCurrentMonthChange,
  children,
}: Props) => {
  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({
    start: monthStart,
    end: endOfMonth(monthStart),
  });

  return (
    <MonthlyCalendarContext.Provider
      value={{
        days,
        locale,
        onCurrentMonthChange,
        currentMonth: monthStart,
      }}
    >
      {children}
    </MonthlyCalendarContext.Provider>
  );
};

export const MonthlyNav = () => {
  const { locale, currentMonth, onCurrentMonthChange } = useMonthlyCalendar();

  return (
    <div className="flex justify-end mb-4">
      <button
        onClick={() => {
          onCurrentMonthChange(subMonths(currentMonth, 1));
        }}
        className="cursor-pointer text-2xl"
      >
        {"<"}
      </button>
      <div
        className="mx-2 w-32 text-center text-xl text-black"
        aria-label="Current Month"
      >
        {format(
          currentMonth,
          getYear(currentMonth) === getYear(new Date()) ? "LLLL" : "LLLL yyyy",
          { locale }
        )}
      </div>
      <button
        onClick={() => onCurrentMonthChange(addMonths(currentMonth, 1))}
        className="cursor-pointer text-2xl"
      >
        {">"}
      </button>
    </div>
  );
};

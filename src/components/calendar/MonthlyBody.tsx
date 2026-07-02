import { addDays, format, getDay, isSameDay, Locale, parseISO, subDays } from "date-fns";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { H5 } from "../panelComponents/Typography";
import { useMonthlyCalendar } from "./MonthlyCalendar";
import { daysInWeek } from "./shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MonthlyBodyContext = createContext({} as any);
type BodyState<DayData> = {
  day: Date;
  events: DayData[];
  isOutsideMonth?: boolean;
};

export function useMonthlyBody<DayData>() {
  return useContext<BodyState<DayData>>(MonthlyBodyContext);
}

type OmittedDaysProps = {
  days: Date[];
  omitDays?: number[];
  locale?: Locale;
};

export const handleOmittedDays = ({
  days,
  omitDays,
  locale,
}: OmittedDaysProps) => {
  let headings = daysInWeek({ locale });
  let daysToRender = days;

  //omit the headings and days of the week that were passed in
  if (omitDays) {
    headings = daysInWeek({ locale }).filter(
      (day) => !omitDays.includes(day.day)
    );
    daysToRender = days.filter((day) => !omitDays.includes(getDay(day)));
  }

  // omit the padding if an omitted day was before the start of the month
  let firstDayOfMonth = getDay(daysToRender[0]) as number;
  firstDayOfMonth = (firstDayOfMonth + 6) % 7;
  if (omitDays) {
    const subtractOmittedDays = omitDays.filter(
      (day) => day < firstDayOfMonth
    ).length;
    firstDayOfMonth = firstDayOfMonth - subtractOmittedDays;
  }
  const padding = new Array(firstDayOfMonth).fill(0);

  return { headings, daysToRender, padding };
};

//to prevent these from being purged in production, we make a lookup object
const headingClasses: { [key: string]: string } = {
  l3: "lg:grid-cols-3",
  l4: "lg:grid-cols-4",
  l5: "lg:grid-cols-5",
  l6: "lg:grid-cols-6",
  l7: "lg:grid-cols-7",
};

type MonthlyBodyProps<DayData> = {
  /*
    skip days, an array of days, starts at sunday (0), saturday is 6
    ex: [0,6] would remove sunday and saturday from rendering
  */
  omitDays?: number[];
  events: (DayData & { date: string })[];
  children: ReactNode;
  /*
    when true, the empty cells before the first day and after the last day
    of the month are replaced with the adjacent days of the previous/next
    month (shaded), instead of being left blank. the caller is responsible
    for fetching events that cover this leading/trailing range as well.
  */
  showOverflowDays?: boolean;
};

export function MonthlyBody<DayData>({
  omitDays,
  events,
  children,
  showOverflowDays,
}: MonthlyBodyProps<DayData>) {
  const { days, locale } = useMonthlyCalendar();
  const { t } = useTranslation();

  const { headings, daysToRender, padding } = handleOmittedDays({
    days,
    omitDays,
    locale,
  });
  const headingClassName = "border-b-2 p-2 border-r-2 lg:block hidden";
  const overflowDays = showOverflowDays
    ? padding.map((_, index) => subDays(daysToRender[0], padding.length - index))
    : [];
  const lastDayIndex = (getDay(daysToRender[daysToRender.length - 1]) + 6) % 7; // Monday=0..Sunday=6
  const trailingOverflowDays = showOverflowDays
    ? Array.from({ length: 6 - lastDayIndex }, (_, index) =>
        addDays(daysToRender[daysToRender.length - 1], index + 1)
      )
    : [];
  const parsedEvents = useMemo(
    () => events.map((event) => ({ event, parsedDate: parseISO(event.date) })),
    [events]
  );
  const eventsForDay = (day: Date) =>
    parsedEvents
      .filter(({ parsedDate }) => isSameDay(parsedDate, day))
      .map(({ event }) => event);
  return (
    <div className="bg-white border-l-2 border-t-2 rounded-lg mb-6">
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 ${
          headingClasses[`l${headings.length}`]
        }`}
      >
        {headings.map((day) => (
          <div
            key={day.day}
            className={headingClassName}
            aria-label="Day of Week"
          >
            <H5>{t(day.label)}</H5>
          </div>
        ))}
        {overflowDays.length > 0
          ? overflowDays.map((day) => (
              <MonthlyBodyContext.Provider
                key={day.toISOString()}
                value={{
                  day,
                  isOutsideMonth: true,
                  events: eventsForDay(day),
                }}
              >
                {children}
              </MonthlyBodyContext.Provider>
            ))
          : padding.map((_, index) => (
              <div
                key={index}
                className={headingClassName}
                aria-label="Empty Day"
              />
            ))}
        {daysToRender.map((day) => (
          <MonthlyBodyContext.Provider
            key={day.toISOString()}
            value={{
              day,
              events: eventsForDay(day),
            }}
          >
            {children}
          </MonthlyBodyContext.Provider>
        ))}
        {trailingOverflowDays.map((day) => (
          <MonthlyBodyContext.Provider
            key={day.toISOString()}
            value={{
              day,
              isOutsideMonth: true,
              events: eventsForDay(day),
            }}
          >
            {children}
          </MonthlyBodyContext.Provider>
        ))}
      </div>
    </div>
  );
}

type MonthlyDayProps<DayData> = {
  renderDay: (events: DayData[]) => ReactNode;
};
export function MonthlyDay<DayData>({ renderDay }: MonthlyDayProps<DayData>) {
  const { locale } = useMonthlyCalendar();
  const { day, events, isOutsideMonth } = useMonthlyBody<DayData>();
  const dayNumber = format(day, "d", { locale });

  return (
    <div
      aria-label={`Events for day ${dayNumber}`}
      className={`h-48 p-2 border-b-2 border-r-2 ${
        isOutsideMonth ? "bg-gray-100 opacity-60" : ""
      }`}
    >
      <div className="flex justify-between">
        <div className={`font-bold ${isOutsideMonth ? "text-gray-400" : ""}`}>
          {dayNumber}
        </div>
        <div className="lg:hidden block">{format(day, "EEEE", { locale })}</div>
      </div>
      <ul className="overflow-hidden max-h-36 overflow-y-auto">
        {renderDay(events)}
      </ul>
    </div>
  );
}

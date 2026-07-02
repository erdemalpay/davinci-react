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

  //parametre olarak geçilen gün başlıklarını ve günleri hariç tut
  if (omitDays) {
    headings = daysInWeek({ locale }).filter(
      (day) => !omitDays.includes(day.day)
    );
    daysToRender = days.filter((day) => !omitDays.includes(getDay(day)));
  }

  // hariç tutulan bir gün ayın başlangıcından önceyse dolguyu (padding) hariç tut
  let firstDayOfMonth = daysToRender[0] ? (getDay(daysToRender[0]) as number) : 0;
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

//production'da bu class'ların silinmesini (purge) önlemek için bir lookup objesi oluşturuyoruz
const headingClasses: { [key: string]: string } = {
  l3: "lg:grid-cols-3",
  l4: "lg:grid-cols-4",
  l5: "lg:grid-cols-5",
  l6: "lg:grid-cols-6",
  l7: "lg:grid-cols-7",
};

type MonthlyBodyProps<DayData> = {
  /*
    atlanacak günler, bir gün dizisi, pazar (0) ile başlar, cumartesi 6'dır
    örn: [0,6] pazar ve cumartesiyi görüntülemeden kaldırır
  */
  omitDays?: number[];
  events: (DayData & { date: string })[];
  children: ReactNode;
  /*
    true olduğunda, ayın ilk gününden önceki ve son gününden sonraki boş
    hücreler, boş bırakılmak yerine önceki/sonraki ayın günleriyle
    (gölgeli olarak) doldurulur. bu baştaki/sondaki aralığı kapsayan
    event'leri getirmek çağıran tarafın sorumluluğundadır.
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
  const firstDay = daysToRender[0];
  const lastDay = daysToRender[daysToRender.length - 1];
  const overflowDays =
    showOverflowDays && firstDay
      ? padding.map((_, index) => subDays(firstDay, padding.length - index))
      : [];
  const lastDayIndex = lastDay ? (getDay(lastDay) + 6) % 7 : 0; // Pazartesi=0..Pazar=6
  const trailingOverflowDays =
    showOverflowDays && lastDay
      ? Array.from({ length: 6 - lastDayIndex }, (_, index) =>
          addDays(lastDay, index + 1)
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
  renderDay: (events: DayData[], day: Date) => ReactNode;
  /*
    renderDay çıktısını saran <ul>'un varsayılan className'ini geçersiz kılar.
    günün öğelerini varsayılan tek sütunlu dizilim yerine bir grid içinde
    (örn. mobilde 2 sütun) göstermek için kullanışlıdır.
  */
  listClassName?: string;
  /*
    çağıranın tek tek gün hücrelerini renklendirmesini sağlar (örn. geçmiş
    günler, bugün). hücrenin tarihini ve komşu aya ait taşan bir gün olup
    olmadığını alır; varsayılan stili değiştirmemek için "" döndürün.
  */
  dayClassName?: (day: Date, isOutsideMonth: boolean) => string;
};
export function MonthlyDay<DayData>({
  renderDay,
  listClassName,
  dayClassName,
}: MonthlyDayProps<DayData>) {
  const { locale } = useMonthlyCalendar();
  const { day, events, isOutsideMonth } = useMonthlyBody<DayData>();
  const dayNumber = format(day, "d", { locale });

  return (
    <div
      aria-label={`Events for day ${dayNumber}`}
      className={`h-48 p-2 border-b-2 border-r-2 ${
        isOutsideMonth
          ? "bg-gray-100 opacity-60"
          : dayClassName?.(day, !!isOutsideMonth) ?? ""
      }`}
    >
      <div className="flex justify-between leading-none">
        <div
          className={`font-bold leading-none ${
            isOutsideMonth ? "text-gray-400" : ""
          }`}
        >
          {dayNumber}
        </div>
        <div className="lg:hidden block leading-none">
          {format(day, "EEEE", { locale })}
        </div>
      </div>
      <ul className={listClassName ?? "overflow-hidden max-h-36 overflow-y-auto"}>
        {renderDay(events, day)}
      </ul>
    </div>
  );
}

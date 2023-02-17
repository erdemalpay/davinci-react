import {
  endOfDay,
  endOfISOWeek,
  endOfMonth,
  format,
  parse,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  subMonths,
  subWeeks,
} from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

export enum DateFilter {
  SINGLE_DAY = "1",
  THIS_WEEK = "2",
  LAST_WEEK = "3",
  THIS_MONTH = "4",
  LAST_MONTH = "5",
  MANUAL = "0",
}

export function formatDate(date: Date) {
  return format(date, DATE_FORMAT);
}

export function parseDate(date?: string) {
  if (!date) return new Date();
  return parse(date, DATE_FORMAT, new Date());
}

export function isToday(date: String) {
  return formatDate(new Date()) === date;
}

export function getStartEndDates(filter: string) {
  const filterType = filter as DateFilter;
  let startDate = "";
  let endDate;
  if (filterType === DateFilter.SINGLE_DAY) {
    startDate = format(startOfDay(new Date()), DATE_FORMAT);
    endDate = format(endOfDay(new Date()), DATE_FORMAT);
  } else if (filterType === DateFilter.THIS_WEEK) {
    startDate = format(startOfISOWeek(new Date()), DATE_FORMAT);
    endDate = undefined;
  } else if (filterType === DateFilter.LAST_WEEK) {
    startDate = format(startOfISOWeek(subWeeks(new Date(), 1)), DATE_FORMAT);
    endDate = format(endOfISOWeek(subWeeks(new Date(), 1)), DATE_FORMAT);
  } else if (filterType === DateFilter.THIS_MONTH) {
    startDate = format(startOfMonth(new Date()), DATE_FORMAT);
    endDate = undefined;
  } else if (filterType === DateFilter.LAST_MONTH) {
    startDate = format(startOfMonth(subMonths(new Date(), 1)), DATE_FORMAT);
    endDate = format(endOfMonth(subMonths(new Date(), 1)), DATE_FORMAT);
  } else if (filterType === DateFilter.MANUAL) {
  }
  return { startDate, endDate };
}

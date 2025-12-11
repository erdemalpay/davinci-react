import {
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { DateRangeKey } from "./../../types/index";
const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

export const dateRanges: {
  [key in DateRangeKey]: () => {
    before: string;
    after: string;
    date: string;
    name?: string;
  };
} = {
  today: () => ({
    before: formatDate(new Date()),
    after: formatDate(new Date()),
    date: "today",
  }),
  yesterday: () => {
    const yesterday = subDays(new Date(), 1);
    return {
      before: formatDate(yesterday),
      after: formatDate(yesterday),
      date: "yesterday",
    };
  },
  thisWeek: () => ({
    before: formatDate(new Date()),
    after: formatDate(startOfWeek(new Date(), { weekStartsOn: 1 })),
    date: "thisWeek",
  }),
  lastWeek: () => ({
    before: formatDate(
      subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 1)
    ),
    after: formatDate(
      subDays(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 1)
    ),
    date: "lastWeek",
  }),
  thisMonth: () => ({
    after: formatDate(startOfMonth(new Date())),
    before: formatDate(endOfMonth(new Date())),
    date: "thisMonth",
  }),
  lastMonth: () => ({
    before: formatDate(subDays(startOfMonth(new Date()), 1)),
    after: formatDate(startOfMonth(subMonths(new Date(), 1))),
    date: "lastMonth",
  }),
  twoMonthsAgo: () => {
    const target = subMonths(new Date(), 2);
    return {
      after: formatDate(startOfMonth(target)),
      before: formatDate(endOfMonth(target)),
      date: "twoMonthsAgo",
      name: format(target, "MMMM"),
    };
  },
  sameDayLastMonthToToday: () => {
    const today = new Date();
    const beforeDate = subMonths(today, 1);
    beforeDate.setDate(today.getDate());

    return {
      before: formatDate(beforeDate),
      after: formatDate(startOfMonth(beforeDate)),
      date: "sameDayLastMonthToToday",
    };
  },
  thisYear: () => ({
    before: formatDate(new Date()),
    after: formatDate(startOfYear(new Date())),
    date: "thisYear",
  }),
  lastYear: () => ({
    before: formatDate(subDays(startOfYear(new Date()), 1)),
    after: formatDate(startOfYear(subYears(new Date(), 1))),
    date: "lastYear",
  }),
  nextWeek: () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);

    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);

    return {
      before: formatDate(nextFriday),
      after: formatDate(nextMonday),
      date: "nextWeek",
    };
  },
  nextMonth: () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    return {
      before: formatDate(endOfMonth(nextMonth)),
      after: formatDate(startOfMonth(nextMonth)),
      date: "nextMonth",
    };
  },
  fromTodayToEndOfNextMonth: () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    return {
      before: formatDate(endOfMonth(nextMonth)),
      after: formatDate(today),
      date: "fromTodayToEndOfNextMonth",
    };
  },
  last7Days: () => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);
    return {
      before: formatDate(today),
      after: formatDate(sevenDaysAgo),
      date: "last7Days",
    };
  },
  last30Days: () => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);
    return {
      before: formatDate(today),
      after: formatDate(thirtyDaysAgo),
      date: "last30Days",
    };
  },
  last3Months: () => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    return {
      before: formatDate(today),
      after: formatDate(startOfMonth(threeMonthsAgo)),
      date: "last3Months",
    };
  },
  last6Months: () => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    return {
      before: formatDate(today),
      after: formatDate(startOfMonth(sixMonthsAgo)),
      date: "last6Months",
    };
  },
  customDate: () => {
    const today = new Date();
    return {
      before: formatDate(today),
      after: formatDate(today),
      date: "customDate",
    };
  },
};

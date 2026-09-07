import {
  addWeeks,
  endOfMonth,
  endOfWeek,
  endOfYear,
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
  today: () => {
    const today = new Date();

    return {
      before: formatDate(today),
      after: formatDate(today),
      date: "today",
    };
  },

  yesterday: () => {
    const yesterday = subDays(new Date(), 1);

    return {
      before: formatDate(yesterday),
      after: formatDate(yesterday),
      date: "yesterday",
    };
  },

  thisWeek: () => {
    const today = new Date();

    return {
      after: formatDate(startOfWeek(today, { weekStartsOn: 1 })),
      before: formatDate(endOfWeek(today, { weekStartsOn: 1 })),
      date: "thisWeek",
    };
  },

  lastWeek: () => {
    const lastWeekDate = subWeeks(new Date(), 1);

    return {
      after: formatDate(
        startOfWeek(lastWeekDate, {
          weekStartsOn: 1,
        })
      ),
      before: formatDate(
        endOfWeek(lastWeekDate, {
          weekStartsOn: 1,
        })
      ),
      date: "lastWeek",
    };
  },

  thisMonth: () => {
    const today = new Date();

    return {
      after: formatDate(startOfMonth(today)),
      before: formatDate(endOfMonth(today)),
      date: "thisMonth",
    };
  },

  lastMonth: () => {
    const lastMonthDate = subMonths(new Date(), 1);

    return {
      after: formatDate(startOfMonth(lastMonthDate)),
      before: formatDate(endOfMonth(lastMonthDate)),
      date: "lastMonth",
    };
  },

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
    const lastMonthDate = subMonths(today, 1);

    return {
      after: formatDate(startOfMonth(lastMonthDate)),
      before: formatDate(lastMonthDate),
      date: "sameDayLastMonthToToday",
    };
  },

  thisYear: () => {
    const today = new Date();

    return {
      after: formatDate(startOfYear(today)),
      before: formatDate(endOfYear(today)),
      date: "thisYear",
    };
  },

  lastYear: () => {
    const lastYearDate = subYears(new Date(), 1);

    return {
      after: formatDate(startOfYear(lastYearDate)),
      before: formatDate(endOfYear(lastYearDate)),
      date: "lastYear",
    };
  },

  nextWeek: () => {
    const nextWeekDate = addWeeks(new Date(), 1);

    return {
      after: formatDate(
        startOfWeek(nextWeekDate, {
          weekStartsOn: 1,
        })
      ),
      before: formatDate(
        endOfWeek(nextWeekDate, {
          weekStartsOn: 1,
        })
      ),
      date: "nextWeek",
    };
  },

  nextMonth: () => {
    const nextMonthDate = subMonths(new Date(), -1);

    return {
      after: formatDate(startOfMonth(nextMonthDate)),
      before: formatDate(endOfMonth(nextMonthDate)),
      date: "nextMonth",
    };
  },

  fromTodayToEndOfNextMonth: () => {
    const today = new Date();
    const nextMonthDate = subMonths(today, -1);

    return {
      after: formatDate(today),
      before: formatDate(endOfMonth(nextMonthDate)),
      date: "fromTodayToEndOfNextMonth",
    };
  },

  last7Days: () => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);

    return {
      after: formatDate(sevenDaysAgo),
      before: formatDate(today),
      date: "last7Days",
    };
  },

  last30Days: () => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);

    return {
      after: formatDate(thirtyDaysAgo),
      before: formatDate(today),
      date: "last30Days",
    };
  },

  last3Months: () => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);

    return {
      after: formatDate(startOfMonth(threeMonthsAgo)),
      before: formatDate(today),
      date: "last3Months",
    };
  },

  last6Months: () => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);

    return {
      after: formatDate(startOfMonth(sixMonthsAgo)),
      before: formatDate(today),
      date: "last6Months",
    };
  },

  customDate: () => {
    const today = new Date();

    return {
      after: formatDate(today),
      before: formatDate(today),
      date: "customDate",
    };
  },
};

import { Location, LocationShiftType, Shift, Visit } from "../types";

export type StaffCountField =
  | "ordersCreated"
  | "ordersPrepared"
  | "ordersDelivered"
  | "collections"
  | "gameplaysCreated"
  | "gameplaysMentored"
  // The narration points of the games explained.
  | "gameplaysMentoredPoints";

// What one person did on one cafe day.
export type StaffDailyCounts = {
  user: string;
  date: string;
} & Record<StaffCountField, number>;

export type AttendanceDay = {
  date: string;
  // A full-time shift counts as a day, a part-time one as 0.75; a day
  // missing from the shift plan counts as a full day.
  weight: number;
  isUnplanned: boolean;
  // The day's middleman (by the middleman records).
  isMiddleman: boolean;
  // Duties in the shift plan.
  isServiceStaff: boolean;
  isOutsideOperation: boolean;
  // Marked in the user summary as left out of the averages.
  isNotInAverage: boolean;
};

export type DayFilters = {
  includeMiddlemanDays: boolean;
  includeServiceStaffDays: boolean;
  // Marked in the user summary without a middleman or service staff duty in
  // the plan.
  includeMarkedDays: boolean;
};

export const PART_TIME_DAY_WEIGHT = 0.75;

// The days someone came in (visits), with how they count by the shift plan.
export function getAttendanceDays({
  userId,
  visits,
  shifts,
  locations,
  location,
  middlemanDates = [],
}: {
  userId: string;
  visits: Visit[];
  shifts: Shift[];
  locations: Location[];
  location?: number;
  middlemanDates?: string[];
}): AttendanceDay[] {
  const days = new Map<string, AttendanceDay>();
  for (const visit of visits) {
    if (visit.user !== userId) continue;
    if (location && visit.location !== location) continue;

    const dayPlan = shifts.find(
      (shift) => shift.day === visit.date && shift.location === visit.location
    );
    const ownShift = dayPlan?.shifts.find((slot) =>
      slot.user?.includes(userId)
    );
    const shiftType = ownShift
      ? locations
          .find((loc) => loc._id === visit.location)
          ?.shifts?.find(
            (slot) => slot.shift === ownShift.shift && slot.isActive
          )?.type
      : undefined;
    const isPlanned =
      shiftType === LocationShiftType.FULLTIME ||
      shiftType === LocationShiftType.PARTTIME;

    const day: AttendanceDay = {
      date: visit.date,
      weight:
        shiftType === LocationShiftType.PARTTIME ? PART_TIME_DAY_WEIGHT : 1,
      isUnplanned: !isPlanned,
      isMiddleman: middlemanDates.includes(visit.date),
      isServiceStaff: !!dayPlan?.shifts.some(
        (slot) => slot.chefUser === userId
      ),
      isOutsideOperation: !!dayPlan?.shifts.some((slot) =>
        slot.outsideOperationUsers?.includes(userId)
      ),
      isNotInAverage: !!ownShift?.notInAverage,
    };

    // Two visits on one day (two locations): one day, the fuller one.
    const seen = days.get(visit.date);
    days.set(
      visit.date,
      seen
        ? {
            ...day,
            weight: Math.max(seen.weight, day.weight),
            isUnplanned: seen.isUnplanned && day.isUnplanned,
            isMiddleman: seen.isMiddleman || day.isMiddleman,
            isServiceStaff: seen.isServiceStaff || day.isServiceStaff,
            isOutsideOperation:
              seen.isOutsideOperation || day.isOutsideOperation,
            isNotInAverage: seen.isNotInAverage || day.isNotInAverage,
          }
        : day
    );
  }
  return [...days.values()];
}

// Whether a day counts, both for what was done that day and for the number
// of days the averages are divided by.
export function isDayCounted(day: AttendanceDay, filters: DayFilters) {
  if (day.isMiddleman && !filters.includeMiddlemanDays) return false;
  if (day.isServiceStaff && !filters.includeServiceStaffDays) return false;
  if (getDayKind(day) === "marked" && !filters.includeMarkedDays) {
    return false;
  }
  return true;
}

// How someone's days went, each day in one kind: a middleman or service
// staff day first, else by the shift plan.
export type DayBreakdown = {
  full: number;
  partTime: number;
  unplanned: number;
  serviceStaff: number;
  middleman: number;
  // Marked as not in average without the duty in the plan.
  marked: number;
};

export type DayKind = keyof DayBreakdown;

export function getDayKind(day: AttendanceDay): DayKind {
  if (day.isMiddleman) return "middleman";
  if (day.isServiceStaff) return "serviceStaff";
  if (day.isNotInAverage) return "marked";
  if (day.isUnplanned) return "unplanned";
  if (day.weight === 1) return "full";
  return "partTime";
}

// The dates of each kind, in order.
export function getDayDates(days: AttendanceDay[]): Record<DayKind, string[]> {
  const dates: Record<DayKind, string[]> = {
    full: [],
    partTime: [],
    unplanned: [],
    serviceStaff: [],
    middleman: [],
    marked: [],
  };
  for (const day of days) {
    dates[getDayKind(day)].push(day.date);
  }
  for (const kindDates of Object.values(dates)) {
    kindDates.sort();
  }
  return dates;
}

export function getDayBreakdown(days: AttendanceDay[]): DayBreakdown {
  const dates = getDayDates(days);
  return {
    full: dates.full.length,
    partTime: dates.partTime.length,
    unplanned: dates.unplanned.length,
    serviceStaff: dates.serviceStaff.length,
    middleman: dates.middleman.length,
    marked: dates.marked.length,
  };
}

export type StaffPerformance = {
  days: DayBreakdown;
  dayDates: Record<DayKind, string[]>;
  // The days the averages are divided by: full days 1, part-time 0.75.
  dayCount: number;
  // Per day.
  averages: Record<StaffCountField, number>;
};

// Someone's daily averages over the days that count, out of the days they
// can be judged on in this table.
export function getStaffPerformance(
  days: AttendanceDay[],
  dailyCounts: StaffDailyCounts[],
  isCounted: (day: AttendanceDay) => boolean
): StaffPerformance {
  const counted = days.filter(isCounted);
  const countedDates = new Set(counted.map((day) => day.date));
  const dayCount = counted.reduce((sum, day) => sum + day.weight, 0);

  const totals: Record<StaffCountField, number> = {
    ordersCreated: 0,
    ordersPrepared: 0,
    ordersDelivered: 0,
    collections: 0,
    gameplaysCreated: 0,
    gameplaysMentored: 0,
    gameplaysMentoredPoints: 0,
  };
  for (const counts of dailyCounts) {
    if (!countedDates.has(counts.date)) continue;
    for (const field of Object.keys(totals) as StaffCountField[]) {
      totals[field] += counts[field] ?? 0;
    }
  }

  const averages = { ...totals };
  for (const field of Object.keys(averages) as StaffCountField[]) {
    averages[field] = dayCount > 0 ? totals[field] / dayCount : 0;
  }
  return {
    days: getDayBreakdown(days),
    dayDates: getDayDates(days),
    dayCount,
    averages,
  };
}

export const mean = (values: number[]) =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

export type PerformanceTone = "best" | "good" | "normal" | "low" | "worst";

// How a value compares with the group's average: 30% or 15% above or below.
export function getPerformanceTone(
  value: number,
  average: number
): PerformanceTone {
  if (average <= 0) return "normal";
  const ratio = value / average;
  if (ratio >= 1.3) return "best";
  if (ratio >= 1.15) return "good";
  if (ratio <= 0.7) return "worst";
  if (ratio <= 0.85) return "low";
  return "normal";
}

// Below this many people in the cafe, two at once on a break is too many.
export const MIN_STAFF_FOR_TWO_BREAKS = 4;

export type BreakWarning = "lowStaff" | "othersOnBreak";

// Whether to ask before starting a break. People outside operation count
// neither as on a break nor as in the cafe.
// - Fewer than 4 people in the cafe: warn when someone else is on a break.
// - Otherwise: warn when two others are on a break already.
export function getBreakWarning(
  othersOnBreakCount: number,
  staffInCafeCount: number
): BreakWarning | null {
  if (staffInCafeCount < MIN_STAFF_FOR_TWO_BREAKS) {
    return othersOnBreakCount >= 1 ? "lowStaff" : null;
  }
  return othersOnBreakCount >= 2 ? "othersOnBreak" : null;
}

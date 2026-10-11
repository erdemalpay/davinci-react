import { describe, expect, it } from "vitest";
import { getBreakWarning } from "./breakWarning";

describe("getBreakWarning", () => {
  it.each([
    // [others on a break, people in the cafe, warning]
    [0, 3, null],
    [1, 3, "lowStaff"],
    [1, 4, null],
    [2, 4, "othersOnBreak"],
    [3, 7, "othersOnBreak"],
  ])("%i on a break with %i in the cafe → %s", (others, inCafe, expected) => {
    expect(getBreakWarning(others, inCafe)).toBe(expected);
  });
});

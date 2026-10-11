import { describe, expect, it } from "vitest";
import { AssignmentActionEnum, DeclineReasonEnum } from "../../types";
import {
  formatDeclineReason,
  hadSeveralAssignees,
  toAssignmentSteps,
} from "./assignmentDisplay";

const { ASSIGNED, DECLINED, CLAIMED } = AssignmentActionEnum;
const t = ((key: string) => key) as never;

describe("toAssignmentSteps", () => {
  it("adds who each take-over was from", () => {
    const steps = toAssignmentSteps([
      { user: "ali", action: ASSIGNED, hour: "12:00:00" },
      { user: "ayse", action: CLAIMED, hour: "12:01:00" },
      { user: "ayse", action: DECLINED, hour: "12:02:00" },
      { user: "mert", action: CLAIMED, hour: "12:03:00" },
    ]);

    expect(steps.map((step) => step.fromUser)).toEqual([
      undefined,
      "ali",
      undefined,
      // Nobody had it after the decline.
      undefined,
    ]);
  });
});

describe("hadSeveralAssignees", () => {
  it("is true only when more than one person was involved", () => {
    expect(hadSeveralAssignees([])).toBe(false);
    expect(
      hadSeveralAssignees([{ user: "ali", action: ASSIGNED, hour: "12:00" }])
    ).toBe(false);
    expect(
      hadSeveralAssignees([
        { user: "ali", action: ASSIGNED, hour: "12:00" },
        { user: "ayse", action: CLAIMED, hour: "12:01" },
      ])
    ).toBe(true);
  });
});

describe("formatDeclineReason", () => {
  const games = [{ _id: 10, name: "Catan" }];

  it("adds the note of other and the game for not knowing it", () => {
    expect(
      formatDeclineReason(
        { reason: DeclineReasonEnum.OTHER, note: "Depo" },
        t,
        games
      )
    ).toBe("Other: Depo");
    expect(
      formatDeclineReason(
        { reason: DeclineReasonEnum.DOESNT_KNOW_GAME, game: 10 },
        t,
        games
      )
    ).toBe("I don't know the game: Catan");
    expect(formatDeclineReason({}, t, games)).toBe("");
  });
});

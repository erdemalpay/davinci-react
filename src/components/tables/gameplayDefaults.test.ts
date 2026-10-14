import { describe, expect, it } from "vitest";
import { ButtonCall, ButtonCallTypeEnum } from "../../types";
import {
  getActivityTableWithGmCall,
  getGameplayDefaultsFromCall,
} from "./gameplayDefaults";

const call = (overrides: Partial<ButtonCall>): ButtonCall => ({
  _id: "1",
  tableName: "5",
  location: 1,
  date: "2026-10-11",
  type: ButtonCallTypeEnum.GAMEMASTERCALL,
  startHour: "12:00:00",
  callCount: 1,
  ...overrides,
});

describe("getGameplayDefaultsFromCall", () => {
  it("uses the assignee and game of the table's open GM call", () => {
    expect(
      getGameplayDefaultsFromCall(
        [
          call({ tableName: "3", assignedTo: "mert", game: 1 }),
          call({ assignedTo: "ayse", game: 10 }),
        ],
        "5"
      )
    ).toEqual({ mentor: "ayse", game: 10 });
  });

  it("ignores service calls and closed calls", () => {
    expect(
      getGameplayDefaultsFromCall(
        [
          call({ type: ButtonCallTypeEnum.ORDERCALL, assignedTo: "ceren" }),
          call({ assignedTo: "ayse", game: 10, finishHour: "12:10:00" }),
        ],
        "5"
      )
    ).toEqual({});
  });

  it("leaves out what the call doesn't have", () => {
    expect(
      getGameplayDefaultsFromCall([call({ assignedTo: "ayse" })], "5")
    ).toEqual({ mentor: "ayse" });
  });
});

describe("getActivityTableWithGmCall", () => {
  it("picks the only activity table with an open GM call", () => {
    expect(
      getActivityTableWithGmCall(
        [
          call({ tableName: "12" }),
          call({ tableName: "13", type: ButtonCallTypeEnum.ORDERCALL }),
          call({ tableName: "14", finishHour: "12:05:00" }),
        ],
        ["12", "13", "14"]
      )
    ).toBe("12");
  });

  it("leaves the choice to staff when several tables are calling", () => {
    expect(
      getActivityTableWithGmCall(
        [call({ tableName: "12" }), call({ tableName: "13" })],
        ["12", "13"]
      )
    ).toBeUndefined();
  });
});

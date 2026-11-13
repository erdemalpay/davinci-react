import { describe, expect, it } from "vitest";
import { groupCatanPlan } from "./catanPlan";

const person = (
  _id: number,
  name: string,
  schedule: { round: number; tableNo: number; seat: number }[],
  isActive = true
) => ({ _id, name, isActive, drawNumber: _id, schedule });

describe("groupCatanPlan", () => {
  const participants = [
    person(1, "Ali", [
      { round: 1, tableNo: 16, seat: 1 },
      { round: 2, tableNo: 16, seat: 2 },
    ]),
    person(2, "Veli", [
      { round: 1, tableNo: 16, seat: 3 },
      { round: 2, tableNo: 1, seat: 1 },
    ]),
    person(3, "Can", [{ round: 1, tableNo: 1, seat: 2 }]),
  ];

  it("turları ve masaları sıralar, oyuncuları başlangıç sırasına dizer", () => {
    const rounds = groupCatanPlan(participants);
    expect(rounds.map((r) => r.round)).toEqual([1, 2]);
    expect(rounds[0].tables.map((t) => t.tableNo)).toEqual([1, 16]);
    expect(rounds[0].tables[1].seats).toEqual([
      { seat: 1, participantId: 1, name: "Ali", isActive: true, drawNumber: 1 },
      {
        seat: 3,
        participantId: 2,
        name: "Veli",
        isActive: true,
        drawNumber: 2,
      },
    ]);
  });

  it("numarası olmayan katılımcıyı atlar", () => {
    const rounds = groupCatanPlan([
      ...participants,
      { _id: 9, name: "Numarasız", isActive: true },
    ]);
    expect(rounds[0].tables.flatMap((t) => t.seats).length).toBe(3);
  });

  it("katılımcı yoksa boş döner", () => {
    expect(groupCatanPlan([])).toEqual([]);
  });
});

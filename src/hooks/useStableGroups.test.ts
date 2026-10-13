import { describe, expect, it } from "vitest";
import { groupStable } from "./useStableGroups";

type Row = { id: number; table: number };
const keyOf = (row: Row) => row.table;

describe("groupStable", () => {
  it("groups items by key", () => {
    const a = { id: 1, table: 3 };
    const b = { id: 2, table: 4 };
    const c = { id: 3, table: 3 };

    const groups = groupStable([a, b, c], keyOf, new Map());

    expect(groups.get(3)).toEqual([a, c]);
    expect(groups.get(4)).toEqual([b]);
  });

  it("keeps the same array for a group that didn't change", () => {
    const a = { id: 1, table: 3 };
    const b = { id: 2, table: 4 };
    const first = groupStable([a, b], keyOf, new Map());

    const b2 = { ...b };
    const second = groupStable([a, b2], keyOf, first);

    // Table 3's card doesn't re-render; table 4's does.
    expect(second.get(3)).toBe(first.get(3));
    expect(second.get(4)).not.toBe(first.get(4));
  });
});

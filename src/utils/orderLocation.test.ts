import { describe, expect, it } from "vitest";
import { OnlineLocationId } from "../types";
import { getOrderLocation } from "./orderLocation";

describe("getOrderLocation", () => {
  it("writes an online sale table's order to the online location", () => {
    expect(getOrderLocation({ isOnlineSale: true }, 2)).toBe(OnlineLocationId);
  });

  it("writes a regular table's order to the given location", () => {
    expect(getOrderLocation({ isOnlineSale: false }, 2)).toBe(2);
    expect(getOrderLocation({}, 1)).toBe(1);
  });

  it("falls back to the given location when there is no table", () => {
    expect(getOrderLocation(undefined, 2)).toBe(2);
  });
});

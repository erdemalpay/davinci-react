import { describe, expect, it } from "vitest";
import { isCollectableAmount, remainingToCollect } from "./collectionAmount";

describe("remainingToCollect", () => {
  it("is the bill minus discounts and collections", () => {
    expect(remainingToCollect(2330, 0, 1390)).toBe(940);
    expect(remainingToCollect(1000, 100, 400)).toBe(500);
  });

  it("is 0, not negative, when more is collected than the bill", () => {
    // Table 5: three payments counted twice on screen.
    expect(remainingToCollect(2330, 0, 2780)).toBe(0);
  });
});

describe("isCollectableAmount", () => {
  it("accepts a positive amount", () => {
    expect(isCollectableAmount(940, 3)).toBe(true);
    expect(isCollectableAmount(100, 0)).toBe(true);
  });

  it("refuses a negative amount", () => {
    expect(isCollectableAmount(-450, 3)).toBe(false);
  });

  it("accepts 0 only when orders are marked paid with it", () => {
    expect(isCollectableAmount(0, 2)).toBe(true);
    expect(isCollectableAmount(0, 0)).toBe(false);
  });

  it("refuses a missing amount", () => {
    expect(isCollectableAmount(Number.NaN, 1)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { formatQuantity, roundQuantity } from "./quantity";

describe("formatQuantity", () => {
  it("shows whole numbers as they are", () => {
    expect(formatQuantity(1)).toBe("1");
    expect(formatQuantity(3)).toBe("3");
    expect(formatQuantity(0)).toBe("0");
    expect(formatQuantity(0.9999999999999998)).toBe("1");
    expect(formatQuantity(2.220446049250313e-16)).toBe("0");
  });

  it("keeps short decimals", () => {
    expect(formatQuantity(0.5)).toBe("0.5");
    expect(formatQuantity(0.25)).toBe("0.25");
    expect(formatQuantity(0.6000000000000001)).toBe("0.6");
    expect(formatQuantity(1.6)).toBe("1.6");
  });

  it("shows split items as fractions", () => {
    expect(formatQuantity(1 / 7)).toBe("1/7");
    expect(formatQuantity(0.14285714285714302)).toBe("1/7");
    expect(formatQuantity(0.143)).toBe("1/7");
    expect(formatQuantity(roundQuantity(2 / 7))).toBe("2/7");
    expect(formatQuantity(0.333)).toBe("1/3");
    expect(formatQuantity(0.667)).toBe("2/3");
    expect(formatQuantity(0.167)).toBe("1/6");
    expect(formatQuantity(1 + 1 / 3)).toBe("1 1/3");
  });

  it("falls back to 3 decimals", () => {
    expect(formatQuantity(0.1234)).toBe("0.123");
    expect(formatQuantity(0.07)).toBe("0.07");
  });

  it("handles missing values", () => {
    expect(formatQuantity(undefined)).toBe("");
    expect(formatQuantity(NaN)).toBe("");
  });
});

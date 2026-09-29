import { describe, expect, it } from "vitest";
import { getDiscountValueFieldState } from "./orderDiscountForm";

describe("getDiscountValueFieldState", () => {
  it("disables preset value fields for a custom discount", () => {
    expect(
      getDiscountValueFieldState({ isCustom: true, type: "PERCENTAGE" })
    ).toEqual({
      typeRequired: false,
      typeDisabled: true,
      percentageRequired: false,
      percentageDisabled: true,
      amountRequired: false,
      amountDisabled: true,
    });
  });

  it("requires only percentage for a percentage discount", () => {
    expect(
      getDiscountValueFieldState({ isCustom: false, type: "PERCENTAGE" })
    ).toEqual({
      typeRequired: true,
      typeDisabled: false,
      percentageRequired: true,
      percentageDisabled: false,
      amountRequired: false,
      amountDisabled: true,
    });
  });

  it("requires only amount for an amount discount", () => {
    expect(
      getDiscountValueFieldState({ isCustom: false, type: "AMOUNT" })
    ).toEqual({
      typeRequired: true,
      typeDisabled: false,
      percentageRequired: false,
      percentageDisabled: true,
      amountRequired: true,
      amountDisabled: false,
    });
  });

  it("requires a type after leaving custom mode", () => {
    expect(
      getDiscountValueFieldState({ isCustom: false, type: "" })
    ).toMatchObject({
      typeRequired: true,
      typeDisabled: false,
      percentageRequired: false,
      amountRequired: false,
    });
  });
});

import { describe, expect, it } from "vitest";
import { Order, OrderDiscount } from "../../../../types";
import {
  buildCustomDiscountPayload,
  findApplicableCustomDiscount,
  isPresetDiscount,
  validateCustomDiscountValues,
} from "./customDiscount";

const options = {
  maxQuantity: 3,
  unitPrice: 10,
  noteRequired: false,
};

describe("validateCustomDiscountValues", () => {
  it.each([NaN, Infinity, -Infinity])(
    "rejects a non-finite new unit price (%s)",
    (newUnitPrice) => {
      expect(
        validateCustomDiscountValues(
          { newUnitPrice, affectedQuantity: 1, note: "" },
          options
        )
      ).toBe("Enter a valid new unit price");
    }
  );

  it("rejects a negative new unit price", () => {
    expect(
      validateCustomDiscountValues(
        { newUnitPrice: -1, affectedQuantity: 1, note: "" },
        options
      )
    ).toBe("New unit price cannot be negative");
  });

  it.each([10, 11])(
    "rejects a new unit price that is not lower than the current price (%s)",
    (newUnitPrice) => {
      expect(
        validateCustomDiscountValues(
          { newUnitPrice, affectedQuantity: 1, note: "" },
          options
        )
      ).toBe("New unit price must be less than current unit price");
    }
  );

  it.each([0, -1])(
    "rejects an affected quantity below one (%s)",
    (affectedQuantity) => {
      expect(
        validateCustomDiscountValues(
          { newUnitPrice: 8, affectedQuantity, note: "" },
          options
        )
      ).toBe("Affected quantity must be at least one");
    }
  );

  it.each([NaN, Infinity, 1.5])(
    "rejects an affected quantity that is not a finite whole number (%s)",
    (affectedQuantity) => {
      expect(
        validateCustomDiscountValues(
          { newUnitPrice: 8, affectedQuantity, note: "" },
          options
        )
      ).toBe("Affected quantity must be a whole number");
    }
  );

  it("rejects an affected quantity above the remaining quantity", () => {
    expect(
      validateCustomDiscountValues(
        { newUnitPrice: 8, affectedQuantity: 4, note: "" },
        options
      )
    ).toBe("Affected quantity cannot exceed remaining quantity");
  });

  it("requires a non-blank note when the discount requires one", () => {
    expect(
      validateCustomDiscountValues(
        { newUnitPrice: 8, affectedQuantity: 1, note: "   " },
        { ...options, noteRequired: true }
      )
    ).toBe("Please enter a discount note");
  });

  it("accepts a zero new unit price", () => {
    expect(
      validateCustomDiscountValues(
        { newUnitPrice: 0, affectedQuantity: 2, note: "" },
        options
      )
    ).toBeNull();
  });
});

describe("findApplicableCustomDiscount", () => {
  const customDiscount = {
    _id: 9,
    name: "Custom",
    isCustom: true,
    isOnlineOrder: true,
    isStoreOrder: true,
  } as OrderDiscount;

  it("returns the custom definition for the current sales channel", () => {
    expect(findApplicableCustomDiscount([customDiscount], false)).toBe(
      customDiscount
    );
    expect(findApplicableCustomDiscount([customDiscount], true)).toBe(
      customDiscount
    );
  });

  it("defaults a custom definition without channel flags to store orders", () => {
    const unscopedCustomDiscount = {
      ...customDiscount,
      isOnlineOrder: false,
      isStoreOrder: false,
    };

    expect(
      findApplicableCustomDiscount([unscopedCustomDiscount], false)
    ).toBe(unscopedCustomDiscount);
    expect(
      findApplicableCustomDiscount([unscopedCustomDiscount], true)
    ).toBeUndefined();
  });

  it("ignores non-custom, deleted, and wrong-channel definitions", () => {
    expect(
      findApplicableCustomDiscount(
        [
          { ...customDiscount, isCustom: false },
          { ...customDiscount, status: "deleted" },
          { ...customDiscount, isStoreOrder: false },
        ],
        false
      )
    ).toBeUndefined();
  });
});

describe("isPresetDiscount", () => {
  it("keeps regular discounts in the preset picker", () => {
    expect(isPresetDiscount({ isCustom: false } as OrderDiscount)).toBe(true);
  });

  it("excludes custom discounts from the preset picker", () => {
    expect(isPresetDiscount({ isCustom: true } as OrderDiscount)).toBe(false);
  });
});

describe("buildCustomDiscountPayload", () => {
  it("calculates the total discount from new unit price and quantity", () => {
    const order = {
      _id: 42,
      quantity: 4,
      unitPrice: 10,
    } as Order;
    const discount = { _id: 9, isCustom: true } as OrderDiscount;

    expect(
      buildCustomDiscountPayload(order, discount, {
        newUnitPrice: 7.5,
        affectedQuantity: 2,
        note: "  Customer care  ",
      })
    ).toEqual({
      orders: [
        { totalQuantity: 4, selectedQuantity: 2, orderId: 42 },
      ],
      discount: 9,
      customDiscountAmount: 5,
      discountNote: "Customer care",
    });
  });

  it("omits a blank note and never sends the fixed-discount amount field", () => {
    const payload = buildCustomDiscountPayload(
      { _id: 42, quantity: 4, unitPrice: 10 } as Order,
      { _id: 9, isCustom: true } as OrderDiscount,
      { newUnitPrice: 5, affectedQuantity: 1, note: "   " }
    );

    expect(payload).not.toHaveProperty("discountNote");
    expect(payload).not.toHaveProperty("discountAmount");
  });
});

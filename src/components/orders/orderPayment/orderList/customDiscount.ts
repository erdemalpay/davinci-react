import { Order, OrderDiscount, OrderDiscountStatus } from "../../../../types";
import type { CreateOrderForDiscountPayload } from "../../../../utils/api/order/order";

export type CustomDiscountValues = {
  totalDiscountAmount: number;
  affectedQuantity: number;
  note: string;
};

type CustomDiscountValidationOptions = {
  maxQuantity: number;
  unitPrice: number;
  noteRequired: boolean;
};

export const validateCustomDiscountValues = (
  values: CustomDiscountValues,
  options: CustomDiscountValidationOptions
): string | null => {
  const { totalDiscountAmount, affectedQuantity, note } = values;
  const { maxQuantity, unitPrice, noteRequired } = options;

  if (!Number.isFinite(totalDiscountAmount)) {
    return "Enter a valid total discount amount";
  }
  if (totalDiscountAmount <= 0) {
    return "Total discount amount must be greater than zero";
  }
  if (!Number.isFinite(affectedQuantity) || !Number.isInteger(affectedQuantity)) {
    return "Affected quantity must be a whole number";
  }
  if (affectedQuantity < 1) {
    return "Affected quantity must be at least one";
  }
  if (affectedQuantity > maxQuantity) {
    return "Affected quantity cannot exceed remaining quantity";
  }
  if (totalDiscountAmount > unitPrice * affectedQuantity) {
    return "Total discount amount cannot exceed selected items total";
  }
  if (noteRequired && note.trim().length === 0) {
    return "Please enter a discount note";
  }

  return null;
};

export const findApplicableCustomDiscount = (
  discounts: OrderDiscount[],
  isOnlineSale: boolean
): OrderDiscount | undefined =>
  discounts.find(
    (discount) => {
      const hasNoSalesChannel =
        !discount.isOnlineOrder && !discount.isStoreOrder;

      return (
        discount.isCustom === true &&
        discount.status !== OrderDiscountStatus.DELETED &&
        (isOnlineSale
          ? discount.isOnlineOrder
          : discount.isStoreOrder || hasNoSalesChannel)
      );
    }
  );

export const isPresetDiscount = (discount: OrderDiscount): boolean =>
  discount.isCustom !== true;

export const buildCustomDiscountPayload = (
  order: Order,
  discount: OrderDiscount,
  values: CustomDiscountValues
): CreateOrderForDiscountPayload => {
  const note = values.note.trim();

  return {
    orders: [
      {
        totalQuantity: order.quantity,
        selectedQuantity: values.affectedQuantity,
        orderId: order._id,
      },
    ],
    discount: discount._id,
    customDiscountAmount: values.totalDiscountAmount,
    ...(note && { discountNote: note }),
  };
};

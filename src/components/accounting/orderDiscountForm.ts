import { OrderDiscount } from "../../types";

export type OrderDiscountValueForm = {
  isCustom?: boolean;
  type?: string;
};

export function getDiscountValueFieldState(form: OrderDiscountValueForm) {
  const isCustom = form.isCustom === true;
  const isPercentage = !isCustom && form.type === "PERCENTAGE";
  const isAmount = !isCustom && form.type === "AMOUNT";

  return {
    typeRequired: !isCustom,
    typeDisabled: isCustom,
    percentageRequired: isPercentage,
    percentageDisabled: !isPercentage,
    amountRequired: isAmount,
    amountDisabled: !isAmount,
  };
}

// Backend güncellemede bilinmeyen alanı reddediyor (400); _id ve formdaki
// type alanı gönderilmez.
export function toOrderDiscountPayload({
  _id,
  type,
  ...updates
}: Partial<OrderDiscount> & OrderDiscountValueForm): Partial<OrderDiscount> {
  return updates;
}

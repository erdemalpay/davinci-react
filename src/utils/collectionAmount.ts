// What is left to collect for a table. Never below 0, even when the
// collections on screen add up to more than the bill (e.g. counted twice).
export const remainingToCollect = (
  totalAmount: number,
  discountAmount: number,
  collectedAmount: number
) => Math.max(0, totalAmount - discountAmount - collectedAmount);

// A collection is never negative, and 0 only marks free orders as paid.
export const isCollectableAmount = (amount: number, paidOrderCount: number) =>
  amount > 0 || (amount === 0 && paidOrderCount > 0);

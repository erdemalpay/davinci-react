export type SplitPayment = {
  count: number; // kaça bölündü
  paid: number; // kaç kişi ödedi
  share: number; // kişi başı pay
};

const REMAINDER_THRESHOLD = 1;

export function startSplitPayment(
  remainingAmount: number,
  unpaidAmount: number,
  count: number
): { amount: number; splitPayment: SplitPayment | null } {
  const share = Math.round(remainingAmount / count);
  if (share <= 0 || unpaidAmount - share < REMAINDER_THRESHOLD) {
    return { amount: unpaidAmount, splitPayment: null };
  }
  return {
    amount: share,
    splitPayment: count > 1 ? { count, paid: 0, share } : null,
  };
}

export function advanceSplitPayment(
  splitPayment: SplitPayment,
  remainingAmount: number
): { amount: number; splitPayment: SplitPayment } | null {
  const paid = splitPayment.paid + 1;
  if (paid >= splitPayment.count || remainingAmount <= 0) {
    return null;
  }
  const isLastPayer = paid === splitPayment.count - 1;
  const amount =
    isLastPayer || remainingAmount - splitPayment.share < REMAINDER_THRESHOLD
      ? remainingAmount
      : splitPayment.share;
  return { amount, splitPayment: { ...splitPayment, paid } };
}

import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  LoyaltyCoupon,
  LoyaltyCouponStatus,
  loyaltyCouponStatusLabels,
  LoyaltyTransaction,
  loyaltyTransactionTypeLabels,
} from "../../utils/api/loyalty";

export const formatLoyaltyDate = (value?: string) =>
  value ? format(new Date(value), "dd.MM.yyyy HH:mm") : "-";

export function PointChange({ change }: { change: number }) {
  return (
    <span className={change >= 0 ? "text-green-700" : "text-red-700"}>
      {change > 0 ? `+${change}` : change}
    </span>
  );
}

export function TransactionTypeCell({ row }: { row: LoyaltyTransaction }) {
  const { t } = useTranslation();
  return <span>{t(loyaltyTransactionTypeLabels[row.type])}</span>;
}

// Order, coupon or note behind a transaction, whichever it has.
export function TransactionDetailCell({ row }: { row: LoyaltyTransaction }) {
  const { t } = useTranslation();
  const parts: string[] = [];
  if (row.shopifyOrderName) parts.push(row.shopifyOrderName);
  if (row.orderAmount !== undefined && row.rate !== undefined) {
    parts.push(
      t("{{rate}}% of {{amount}} ₺", {
        rate: row.rate,
        amount: row.orderAmount.toFixed(2),
      })
    );
  }
  if (row.couponCode) parts.push(row.couponCode);
  if (row.note) parts.push(row.note);
  return <span>{parts.join(" · ") || "-"}</span>;
}

const couponStatusClasses: Record<LoyaltyCouponStatus, string> = {
  [LoyaltyCouponStatus.ACTIVE]: "bg-green-100 text-green-800",
  [LoyaltyCouponStatus.USED]: "bg-blue-100 text-blue-800",
  [LoyaltyCouponStatus.EXPIRED]: "bg-gray-100 text-gray-700",
  [LoyaltyCouponStatus.RETURNED]: "bg-amber-100 text-amber-800",
};

export function CouponStatusBadge({ row }: { row: LoyaltyCoupon }) {
  const { t } = useTranslation();
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${couponStatusClasses[row.status]}`}
    >
      {t(loyaltyCouponStatusLabels[row.status])}
    </span>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { patch, post } from ".";
import { getApiErrorMessage } from "../getApiErrorMessage";
import { Paths, useGet } from "./factory";

// Online (kutuoyunual.com) loyalty points, kept apart from the cafe points.
// 1 point = 1 TL; points are earned when a Shopify order is fulfilled.

export enum LoyaltyTransactionType {
  EARN = "EARN",
  EARN_REVERSAL = "EARN_REVERSAL",
  REDEEM = "REDEEM",
  COUPON_RETURN = "COUPON_RETURN",
  MANUAL = "MANUAL",
}

export enum LoyaltyCouponStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
  RETURNED = "RETURNED",
}

export type LoyaltySettings = {
  _id: string;
  isActive: boolean;
  earnRate: number;
  couponValidityDays: number;
  minRedeemPoints: number;
  updatedBy?: string;
  updatedAt?: string;
};

export type LoyaltyAccount = {
  _id: number;
  shopifyCustomerId: string;
  email?: string;
  name?: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  createdAt: string;
  updatedAt: string;
};

type AccountRef = Pick<
  LoyaltyAccount,
  "_id" | "name" | "email" | "shopifyCustomerId"
>;

export type LoyaltyTransaction = {
  _id: number;
  account: number | AccountRef;
  shopifyCustomerId: string;
  type: LoyaltyTransactionType;
  change: number;
  balanceAfter: number;
  shopifyOrderId?: string;
  shopifyOrderName?: string;
  orderAmount?: number;
  rate?: number;
  couponCode?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
};

export type LoyaltyCoupon = {
  _id: number;
  account: number | AccountRef;
  shopifyCustomerId: string;
  code: string;
  value: number;
  status: LoyaltyCouponStatus;
  shopifyDiscountId?: string;
  expiresAt: string;
  usedOrderId?: string;
  usedOrderName?: string;
  usedAt?: string;
  createdAt: string;
};

export type LoyaltySummary = {
  accountCount: number;
  outstandingPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  coupons: Partial<Record<LoyaltyCouponStatus, { count: number; value: number }>>;
  thisMonth: Partial<
    Record<LoyaltyTransactionType, { points: number; count: number }>
  >;
};

export type Paginated<T> = {
  data: T[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type LoyaltyAccountDetail = {
  account: LoyaltyAccount | null;
  transactions: LoyaltyTransaction[];
  coupons: LoyaltyCoupon[];
};

const baseUrl = Paths.Loyalty;

// Every key starts with Paths.Loyalty so the "loyaltyChanged" socket event
// refreshes all of them.
export function useGetLoyaltySettings() {
  return useGet<LoyaltySettings>(`${baseUrl}/settings`, [baseUrl, "settings"], true);
}

export function useGetLoyaltySummary() {
  return useGet<LoyaltySummary>(`${baseUrl}/summary`, [baseUrl, "summary"], true);
}

export function useGetLoyaltyAccounts(page: number, limit: number, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });
  return useGet<Paginated<LoyaltyAccount>>(
    `${baseUrl}/accounts?${params}`,
    [baseUrl, "accounts", page, limit, search],
    true
  );
}

export function useGetLoyaltyAccountDetail(shopifyCustomerId?: string) {
  return useGet<LoyaltyAccountDetail>(
    `${baseUrl}/accounts/${shopifyCustomerId}`,
    [baseUrl, "account", shopifyCustomerId],
    true,
    { enabled: !!shopifyCustomerId }
  );
}

export function useGetLoyaltyTransactions(
  page: number,
  limit: number,
  type?: LoyaltyTransactionType
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(type ? { type } : {}),
  });
  return useGet<Paginated<LoyaltyTransaction>>(
    `${baseUrl}/transactions?${params}`,
    [baseUrl, "transactions", page, limit, type ?? ""],
    true
  );
}

export function useGetLoyaltyCoupons(
  page: number,
  limit: number,
  status?: LoyaltyCouponStatus
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status ? { status } : {}),
  });
  return useGet<Paginated<LoyaltyCoupon>>(
    `${baseUrl}/coupons?${params}`,
    [baseUrl, "coupons", page, limit, status ?? ""],
    true
  );
}

export function useUpdateLoyaltySettingsMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: Partial<LoyaltySettings>) =>
      patch<Partial<LoyaltySettings>, LoyaltySettings>({
        path: `${baseUrl}/settings`,
        payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [baseUrl] });
      toast.success(t("Saved"));
    },
    onError: (err) =>
      toast.error(t(getApiErrorMessage(err, "An unexpected error occurred"))),
  });
}

export function useAdjustLoyaltyPointsMutation(shopifyCustomerId?: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: { change: number; note: string }) =>
      post<{ change: number; note: string }, unknown>({
        path: `${baseUrl}/accounts/${shopifyCustomerId}/adjust`,
        payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [baseUrl] });
      toast.success(t("Points updated"));
    },
    onError: (err) =>
      toast.error(t(getApiErrorMessage(err, "An unexpected error occurred"))),
  });
}

export const loyaltyTransactionTypeLabels: Record<LoyaltyTransactionType, string> = {
  [LoyaltyTransactionType.EARN]: "Earned from order",
  [LoyaltyTransactionType.EARN_REVERSAL]: "Taken back (refund/cancel)",
  [LoyaltyTransactionType.REDEEM]: "Turned into coupon",
  [LoyaltyTransactionType.COUPON_RETURN]: "Coupon returned",
  [LoyaltyTransactionType.MANUAL]: "Manual change",
};

export const loyaltyCouponStatusLabels: Record<LoyaltyCouponStatus, string> = {
  [LoyaltyCouponStatus.ACTIVE]: "Active",
  [LoyaltyCouponStatus.USED]: "Used",
  [LoyaltyCouponStatus.EXPIRED]: "Expired",
  [LoyaltyCouponStatus.RETURNED]: "Returned",
};

import { MenuItem } from "../../types";
import { useGet } from "./factory";

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  NOTIFIED = "NOTIFIED",
  CANCELLED = "CANCELLED",
}

export interface BackInStockSubscription {
  _id: number;
  email: string;
  shop: string;
  productId: string;
  productTitle: string;
  productUrl: string;
  variantId: string;
  variantTitle: string;
  variantPrice: string;
  subscribedAt: Date;
  status: SubscriptionStatus;
  menuItemId?: number | MenuItem;
  notifiedAt?: Date;
  cancelledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BackInStockQueryParams {
  page?: number;
  limit?: number;
  email?: string;
  shop?: string;
  productId?: string;
  variantId?: string;
  status?: SubscriptionStatus;
  after?: string;
  before?: string;
  sort?: string;
  asc?: 1 | -1;
}

export function useGetBackInStockSubscriptions(
  filters: BackInStockQueryParams = {}
) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  const path = `/back-in-stock/query${queryString ? `?${queryString}` : ""}`;
  return useGet<BackInStockSubscription[]>(
    path,
    ["back-in-stock", filters],
    true
  );
}

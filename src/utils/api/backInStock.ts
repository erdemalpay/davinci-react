import { useQuery } from "@tanstack/react-query";
import { get } from ".";

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
  menuItemId?: number;
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

export interface BackInStockResponse {
  subscriptions: BackInStockSubscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useGetBackInStockSubscriptions(
  page: number,
  limit: number,
  filters: BackInStockQueryParams = {}
) {
  const queryParams = new URLSearchParams();

  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  const path = `/back-in-stock/query${queryString ? `?${queryString}` : ""}`;

  const { data } = useQuery<BackInStockResponse>({
    queryKey: ["back-in-stock", page, limit, filters],
    queryFn: () => get<BackInStockResponse>({ path }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return data;
}

import { Paths, useGet } from "./factory";

// Favorites (wishlist) of kutuoyunual.com customers, kept by davinci-api.
// Every query key starts with Paths.Favorites so the "favoritesChanged"
// socket event refreshes all of them.

export type FavoriteProduct = {
  productId: string;
  handle: string;
  title: string;
  status: string;
  imageUrl: string | null;
  price: number | null;
  compareAtPrice: number | null;
  totalInventory: number | null;
  onlineStoreUrl: string | null;
};

export type CustomerFavorite = FavoriteProduct & { addedAt: string };

export type TopFavoriteProduct = FavoriteProduct & {
  favoriteCount: number;
  lastAddedAt: string;
};

export type FavoriteProductCustomer = {
  customerId: string;
  name: string | null;
  email: string | null;
  numberOfOrders: number | null;
  addedAt: string;
};

export type FavoritesSummary = {
  totalFavorites: number;
  customerCount: number;
  productCount: number;
  addedLast30Days: number;
};

const baseUrl = Paths.Favorites;

export function useGetFavoritesSummary() {
  return useGet<FavoritesSummary>(`${baseUrl}/summary`, [baseUrl, "summary"], true);
}

export function useGetTopFavoriteProducts(limit: number, after?: string, before?: string) {
  const params = new URLSearchParams({
    limit: String(limit),
    ...(after ? { after } : {}),
    ...(before ? { before } : {}),
  });
  return useGet<TopFavoriteProduct[]>(
    `${baseUrl}/products?${params}`,
    [baseUrl, "products", limit, after ?? "", before ?? ""],
    true
  );
}

export function useGetFavoriteProductCustomers(productId?: string) {
  return useGet<FavoriteProductCustomer[]>(
    `${baseUrl}/products/${productId}/customers`,
    [baseUrl, "product-customers", productId],
    true,
    { enabled: !!productId }
  );
}

export function useGetCustomerFavorites(customerId?: string) {
  return useGet<CustomerFavorite[]>(
    `${baseUrl}/customers/${customerId}`,
    [baseUrl, "customer", customerId],
    true,
    { enabled: !!customerId }
  );
}

// { [shopifyCustomerId]: count } for the customers on the current page.
export function useGetFavoriteCounts(customerIds: string[]) {
  const ids = customerIds.join(",");
  return useGet<Record<string, number>>(
    `${baseUrl}/counts?customerIds=${encodeURIComponent(ids)}`,
    [baseUrl, "counts", ids],
    true,
    { enabled: ids.length > 0 }
  );
}

export const formatTl = (value: number | null) =>
  value === null ? "-" : `${value.toFixed(2)} ₺`;

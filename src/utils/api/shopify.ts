import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch, post } from ".";
import { ShopifyAdminCustomer, ShopifyCustomersPaginatedResponse, ShopifyProduct } from "../../types";
import { Paths, useGet, useGetList } from "./factory";

interface UpdateShopifyProductPayload {
  variantId: string;
  stockLocationId: number;
  stockCount: number;
}
interface UpdateShopifyProductImage {
  itemId: number;
}
interface UpdateShopifyProductPricePayload {
  productId: string;
  variantId: string;
  newPrice: number;
}
export function useGetShopifyProducts() {
  return useGetList<ShopifyProduct>(`${Paths.Shopify}/product`);
}

export function useGetShopifyCustomers(
  page: number,
  limit: number,
  search?: string
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.append("search", search);
  const path = `${Paths.Shopify}/customer?${params.toString()}`;
  return useGet<ShopifyCustomersPaginatedResponse>(path, [
    `${Paths.Shopify}/customer`,
    page,
    limit,
    search ?? "",
  ]);
}

export function useRefreshShopifyCustomersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post({ path: `${Paths.Shopify}/customer/refresh`, payload: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`${Paths.Shopify}/customer`],
      });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function updateShopifyProductStock(
  payload: UpdateShopifyProductPayload
) {
  return patch({
    path: `${Paths.Shopify}/product-stock`,
    payload: payload,
  });
}
export function updateShopifyProductImage(payload: UpdateShopifyProductImage) {
  return post({
    path: `${Paths.Shopify}/product-image`,
    payload: payload,
  });
}

export function updateShopifyProductPrice(
  payload: UpdateShopifyProductPricePayload
) {
  return patch({
    path: `${Paths.Shopify}/product-price`,
    payload: payload,
  });
}

export function useUpdateShopifyProductStockMutation() {
  const queryKey = [`${Paths.Shopify}/product-stock`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShopifyProductStock,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useUpdateShopifyProductImageMutation() {
  const queryKey = [`${Paths.Shopify}/product-image`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShopifyProductImage,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useUpdateShopifyProductPriceMutation() {
  const queryKey = [`${Paths.Shopify}/product-price`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShopifyProductPrice,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

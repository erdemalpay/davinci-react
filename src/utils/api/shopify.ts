import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch, post, remove } from ".";
import { ShopifyCustomersPaginatedResponse, ShopifyDiscountNode, ShopifyDiscountsPaginatedResponse, ShopifyProduct } from "../../types";
import { Paths, useGet, useGetList } from "./factory";

export interface CreateShopifyDiscountPayload {
  title: string;
  code: string;
  valueType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  startsAt: string;
  endsAt?: string;
  minimumRequirementType?: "NONE" | "SUBTOTAL" | "QUANTITY";
  minimumRequirementValue?: number;
  usageLimit?: number;
  appliesOncePerCustomer?: boolean;
  combinesWithProductDiscounts?: boolean;
  combinesWithOrderDiscounts?: boolean;
  combinesWithShippingDiscounts?: boolean;
}

export interface UpdateShopifyDiscountPayload extends Partial<CreateShopifyDiscountPayload> {
  id: string;
}

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

export interface CreateFreeShippingDiscountPayload {
  method: 'CODE' | 'AUTOMATIC';
  title: string;
  code?: string;
  startsAt: string;
  endsAt?: string;
  minimumRequirementType?: 'NONE' | 'SUBTOTAL' | 'QUANTITY';
  minimumRequirementValue?: number;
  usageLimit?: number;
  appliesOncePerCustomer?: boolean;
}

const DISCOUNT_QUERY_KEY = [`${Paths.Shopify}/discount`];

export function useGetShopifyDiscountsPaginated(
  page: number,
  limit: number,
  search?: string,
  status?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  const path = `${Paths.Shopify}/discount?${params.toString()}`;
  return useGet<ShopifyDiscountsPaginatedResponse>(
    path,
    [`${Paths.Shopify}/discount`, page, limit, search ?? "", status ?? ""],
    true,
  );
}

export function useCreateShopifyDiscountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateShopifyDiscountPayload) =>
      post({ path: `${Paths.Shopify}/discount`, payload }),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: DISCOUNT_QUERY_KEY });
      }, 3000);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useUpdateShopifyDiscountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateShopifyDiscountPayload) =>
      patch({ path: `${Paths.Shopify}/discount`, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_QUERY_KEY });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export interface UpdateFreeShippingDiscountPayload {
  id: string;
  title?: string;
  code?: string;
  startsAt?: string;
  endsAt?: string;
  minimumRequirementType?: 'NONE' | 'SUBTOTAL' | 'QUANTITY';
  minimumRequirementValue?: number;
  usageLimit?: number;
  appliesOncePerCustomer?: boolean;
}

export function useUpdateFreeShippingDiscountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFreeShippingDiscountPayload) =>
      patch({ path: `${Paths.Shopify}/discount/free-shipping`, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_QUERY_KEY });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useCreateFreeShippingDiscountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFreeShippingDiscountPayload) =>
      post({ path: `${Paths.Shopify}/discount/free-shipping`, payload }),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: DISCOUNT_QUERY_KEY });
      }, 3000);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useDeleteShopifyDiscountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      remove({ path: `${Paths.Shopify}/discount/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_QUERY_KEY });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

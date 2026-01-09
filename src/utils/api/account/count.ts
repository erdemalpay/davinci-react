import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AccountCount, FormElementsState } from "../../../types";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";
import { patch } from "../index";
interface UpdateStockPayload {
  product: string;
  location: string;
  quantity: number;
  currentCountId: string;
}

interface UpdateCountQuantityPayload {
  countId: string;
  productId: string;
  countQuantity: number;
  stockQuantity: number;
  productDeleteRequest?: string;
  currentProducts: {
    product: string;
    stockQuantity: number;
    countQuantity: number;
    isStockEqualized?: boolean;
    productDeleteRequest?: string;
  }[];
}
export interface CountsPayload {
  data: AccountCount[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface UpdateStockBulkPayload {
  currentCountId: string;
}
const baseUrl = `${Paths.Accounting}/counts`;
export function useAccountCountMutations() {
  const {
    updateItem: updateAccountCount,
    createItem: createAccountCount,
    deleteItem: deleteAccountCount,
  } = useMutationApi<AccountCount>({
    baseQuery: baseUrl,
  });

  return {
    updateAccountCount,
    createAccountCount,
    deleteAccountCount,
  };
}
export const updateStockForStockCount = (payload: UpdateStockPayload) => {
  return patch({
    path: `/accounting/stock_equalize`,
    payload: payload,
  });
};

export function useGetCountById(id: string) {
  return useGet<AccountCount>(
    `${Paths.Accounting}/counts/${id}`,
    [Paths.Accounting, "counts", id],
    true
  );
}
export function useUpdateStockForStockCountMutation() {
  const queryKey = [`${Paths.Accounting}/stocks`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStockForStockCount,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: [baseUrl] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [baseUrl] });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export const updateStockForStockCountBulk = (
  payload: UpdateStockBulkPayload
) => {
  return patch({
    path: `/accounting/stock_equalize_bulk`,
    payload: payload,
  });
};

export function useUpdateStockForStockCountBulkMutation() {
  const queryKey = [`${Paths.Accounting}/stocks`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStockForStockCountBulk,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: [baseUrl] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [baseUrl] });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useGetAccountCounts() {
  return useGetList<AccountCount>(baseUrl);
}
export function useGetQueryCounts(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const baseQueryUrl = `${Paths.Accounting}/counts/query`;

  const queryKey = [
    baseQueryUrl,
    {
      page,
      limit,
      createdBy: filters.createdBy ?? null,
      countList: filters.countList ?? null,
      location: filters.location ?? null,
      after: filters.after ?? null,
      before: filters.before ?? null,
      sort: filters.sort ?? null,
      asc: filters.asc ?? null,
      search: filters.search ?? null,
    },
  ] as const;

  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.createdBy && `createdBy=${filters.createdBy}`,
    filters.countList && `countList=${filters.countList}`,
    filters.location && `location=${filters.location}`,
    filters.after && `after=${filters.after}`,
    filters.before && `before=${filters.before}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
    filters.search && `search=${filters.search}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  const url = `${baseQueryUrl}?${queryString}`;

  return useGet<CountsPayload>(url, queryKey, true);
}

export const updateCountQuantity = (payload: UpdateCountQuantityPayload) => {
  const {
    countId,
    productId,
    countQuantity,
    stockQuantity,
    productDeleteRequest,
    currentProducts,
  } = payload;

  // Build the new products array just like the old version
  const newProducts = [
    ...(currentProducts?.filter((p) => p.product !== productId) || []),
    {
      product: productId,
      countQuantity,
      stockQuantity,
      productDeleteRequest,
    },
  ];

  return patch({
    path: `${Paths.Accounting}/counts/${countId}`,
    payload: {
      products: newProducts,
      isCompleted: false,
    },
  });
};

export function useUpdateCountQuantityMutation() {
  const queryClient = useQueryClient();
  const queryKey = [baseUrl];

  return useMutation({
    mutationFn: updateCountQuantity,
    onMutate: async (newData: UpdateCountQuantityPayload) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousCounts = queryClient.getQueryData<AccountCount[]>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<AccountCount[]>(queryKey, (old) => {
        if (!old) return old;

        return old.map((count) => {
          if (count._id !== newData.countId) return count;

          // Update the specific product in the count
          const updatedProducts =
            count.products?.filter((p) => p.product !== newData.productId) ||
            [];

          updatedProducts.push({
            product: newData.productId,
            countQuantity: newData.countQuantity,
            stockQuantity: newData.stockQuantity,
            productDeleteRequest: newData.productDeleteRequest,
          });

          return {
            ...count,
            products: updatedProducts,
            isCompleted: false,
          };
        });
      });

      // Return a context object with the snapshotted value
      return { previousCounts };
    },
    onError: (_err: any, _newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCounts) {
        queryClient.setQueryData(queryKey, context.previousCounts);
      }
      // Invalidate on error to ensure we have the correct server state
      queryClient.invalidateQueries({ queryKey });
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

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

export function useUpdateStockForStockCountMutation() {
  const queryKey = [`${Paths.Accounting}/stocks`];
  const queryClient = useQueryClient();
  return useMutation(updateStockForStockCount, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
      await queryClient.cancelQueries([baseUrl]);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries([baseUrl]);
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
  return useMutation(updateStockForStockCountBulk, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
      await queryClient.cancelQueries([baseUrl]);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries([baseUrl]);
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
  const url = `${baseUrl}/query?${queryString}`;

  return useGet<CountsPayload>(url, [url, page, limit, filters], true);
}

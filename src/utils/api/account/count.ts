import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AccountCount } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { patch } from "../index";

interface UpdateStockPayload {
  product: string;
  location: string;
  quantity: number;
  currentCountId: string;
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

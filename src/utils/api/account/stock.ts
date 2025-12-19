import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useFilterContext } from "../../../context/Filter.context";
import { AccountStock } from "../../../types";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";
import { post } from "../index";
import { useOrderContext } from "./../../../context/Order.context";

interface ConsumptStockPayload {
  product: string;
  location: string;
  quantity: number;
}
interface StockTransferPayload {
  currentStockLocation: string;
  transferredStockLocation: string;
  product: string;
  quantity: number;
}

const baseUrl = `${Paths.Accounting}/stocks`;

export function useAccountStockMutations() {
  const {
    deleteItem: deleteAccountStock,
    updateItem: updateAccountStock,
    createItem: createAccountStock,
  } = useMutationApi<AccountStock>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountStock,
    updateAccountStock,
    createAccountStock,
  };
}

export function useGetFilteredStocks(after?: string, location?: string) {
  const params = new URLSearchParams();

  if (after) params.append("after", after);
  if (location !== undefined && location !== "")
    params.append("location", String(location));

  const query = params.toString();
  const url = `${Paths.Accounting}/stocks/query${query ? `?${query}` : ""}`;

  return useGetList<AccountStock>(url, [
    `${Paths.Accounting}/stocks/query`,
    after,
    location,
  ]);
}

export function useGetSummaryStockTotal() {
  const { filterSummaryFormElements } = useOrderContext();
  return useGet<{
    afterTotalValue: number;
    beforeTotalValue: number;
  }>(
    `${Paths.Accounting}/stocks/summary/query?after=${
      filterSummaryFormElements.after
    }&before=${filterSummaryFormElements.before}&location=${Number(
      filterSummaryFormElements.location
    )}`
  );
}
export function consumptStock(payload: ConsumptStockPayload) {
  return post<ConsumptStockPayload, AccountStock>({
    path: `${Paths.Accounting}/stocks/consumpt`,
    payload,
  });
}
export function stockTransfer(payload: StockTransferPayload) {
  return post<StockTransferPayload, AccountStock>({
    path: `${Paths.Accounting}/stock_transfer`,
    payload,
  });
}
export function updateIkasStocks() {
  return post<any, any>({
    path: `${Paths.Ikas}/update-all-stocks`,
    payload: {},
  });
}
export function useUpdateIkasStocksMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIkasStocks,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function updateProductBaseStocks() {
  return post<any, any>({
    path: `${Paths.Accounting}/stocks/create-all-product`,
    payload: {},
  });
}
export function useUpdateProductBaseStocks() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductBaseStocks,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useConsumptStockMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: consumptStock,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useStockTransferMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  const { filterStockPanelFormElements } = useFilterContext();
  return useMutation({
    mutationFn: stockTransfer,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({
        queryKey: [
          `${Paths.Accounting}/stocks/query?after=${filterStockPanelFormElements.after}`,
        ],
      });
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useGetAccountStocks() {
  return useGetList<AccountStock>(baseUrl);
}

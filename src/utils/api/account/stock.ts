import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AccountStock } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { post } from "../index";
import { useStockContext } from "./../../../context/Stock.context";

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

export function useGetFilteredStocks() {
  const { filterPanelFormElements } = useStockContext();
  return useGetList<AccountStock>(
    `${Paths.Accounting}/stocks/query?after=${filterPanelFormElements.after}`
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
export function useConsumptStockMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(consumptStock, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
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
  return useMutation(stockTransfer, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
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

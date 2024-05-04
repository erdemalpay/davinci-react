import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountStock } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { post } from "../index";

interface ConsumptStockPayload {
  product: string;
  location: string;
  quantity: number;
  packageType: string;
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

export function consumptStock(payload: ConsumptStockPayload) {
  return post<ConsumptStockPayload, AccountStock>({
    path: `${Paths.Accounting}/stocks/consumpt`,
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
  });
}

export function useGetAccountStocks() {
  return useGetList<AccountStock>(baseUrl);
}

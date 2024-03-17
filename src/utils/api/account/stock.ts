import { AccountStock } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

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

export function useGetAccountStocks() {
  return useGetList<AccountStock>(baseUrl);
}

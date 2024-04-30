import { AccountFixtureStock } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/fixture-stocks`;
export function useAccountFixtureStockMutations() {
  const {
    deleteItem: deleteAccountFixtureStock,
    updateItem: updateAccountFixtureStock,
    createItem: createAccountFixtureStock,
  } = useMutationApi<AccountFixtureStock>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountFixtureStock,
    updateAccountFixtureStock,
    createAccountFixtureStock,
  };
}

export function useGetAccountFixtureStocks() {
  return useGetList<AccountFixtureStock>(baseUrl);
}

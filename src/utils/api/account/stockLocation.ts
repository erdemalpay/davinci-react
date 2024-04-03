import { AccountStockLocation } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/stock-locations`;
export function useAccountStockLocationMutations() {
  const {
    deleteItem: deleteAccountStockLocation,
    updateItem: updateAccountStockLocation,
    createItem: createAccountStockLocation,
  } = useMutationApi<AccountStockLocation>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountStockLocation,
    updateAccountStockLocation,
    createAccountStockLocation,
  };
}

export function useGetAccountStockLocations() {
  return useGetList<AccountStockLocation>(baseUrl);
}

import { AccountStockType } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/stock-types`;
export function useAccountStockTypeMutations() {
  const {
    deleteItem: deleteAccountStockType,
    updateItem: updateAccountStockType,
    createItem: createAccountStockType,
  } = useMutationApi<AccountStockType>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountStockType,
    updateAccountStockType,
    createAccountStockType,
  };
}

export function useGetAccountStockTypes() {
  return useGetList<AccountStockType>(baseUrl);
}

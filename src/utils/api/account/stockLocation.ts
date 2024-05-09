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
    additionalInvalidates: [
      [`${Paths.Accounting}/invoices`],
      [`${Paths.Accounting}/fixture-invoice`],
      [`${Paths.Accounting}/service-invoice`],
    ],
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

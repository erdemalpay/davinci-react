import { AccountBrand } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/brands`;

export function useAccountBrandMutations() {
  const {
    deleteItem: deleteAccountBrand,
    updateItem: updateAccountBrand,
    createItem: createAccountBrand,
  } = useMutationApi<AccountBrand>({
    baseQuery: baseUrl,
    additionalInvalidates: [
      [`${Paths.Accounting}/invoices`],
      [`${Paths.Accounting}/fixture-invoice`],
    ],
  });

  return {
    deleteAccountBrand,
    updateAccountBrand,
    createAccountBrand,
  };
}

export function useGetAccountBrands() {
  return useGetList<AccountBrand>(baseUrl);
}

import { AccountVendor } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/vendors`;

export function useAccountVendorMutations() {
  const {
    deleteItem: deleteAccountVendor,
    updateItem: updateAccountVendor,
    createItem: createAccountVendor,
  } = useMutationApi<AccountVendor>({
    baseQuery: baseUrl,
    additionalInvalidates: [[`${Paths.Accounting}/invoices`]],
  });

  return {
    deleteAccountVendor,
    updateAccountVendor,
    createAccountVendor,
  };
}

export function useGetAccountVendors() {
  return useGetList<AccountVendor>(baseUrl);
}

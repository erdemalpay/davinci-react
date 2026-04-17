import { AccountRetailer } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Order}/retailer`;

export function useAccountRetailerMutations() {
  const {
    deleteItem: deleteAccountRetailer,
    updateItem: updateAccountRetailer,
    createItem: createAccountRetailer,
  } = useMutationApi<AccountRetailer>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountRetailer,
    updateAccountRetailer,
    createAccountRetailer,
  };
}

export function useGetAccountRetailers() {
  return useGetList<AccountRetailer>(baseUrl);
}

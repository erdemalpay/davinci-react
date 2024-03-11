import { AccountProduct } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useAccountProductMutations() {
  const {
    deleteItem: deleteAccountProduct,
    updateItem: updateAccountProduct,
    createItem: createAccountProduct,
  } = useMutationApi<AccountProduct>({
    baseQuery: Paths.AccountProduct,
  });

  return { deleteAccountProduct, updateAccountProduct, createAccountProduct };
}

export function useGetAccountProducts() {
  return useGetList<AccountProduct>(Paths.AccountProduct);
}

import { AccountProduct } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/products`;

export function useAccountProductMutations() {
  const {
    deleteItem: deleteAccountProduct,
    updateItem: updateAccountProduct,
    createItem: createAccountProduct,
  } = useMutationApi<AccountProduct>({
    baseQuery: baseUrl,
  });

  return { deleteAccountProduct, updateAccountProduct, createAccountProduct };
}

export function useGetAccountProducts() {
  return useGetList<AccountProduct>(baseUrl);
}

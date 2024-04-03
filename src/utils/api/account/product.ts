import { AccountProduct } from "../../../types";
import { post } from ".././index";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/products`;

export interface JoinProductsRequest {
  stayedProduct: string;
  removedProduct: string;
}
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

export function joinProducts({
  stayedProduct,
  removedProduct,
}: JoinProductsRequest): Promise<AccountProduct> {
  return post<JoinProductsRequest, AccountProduct>({
    path: `${Paths.Accounting}/products/join`,
    payload: { stayedProduct, removedProduct },
  });
}

export function useGetAccountProducts() {
  return useGetList<AccountProduct>(baseUrl);
}

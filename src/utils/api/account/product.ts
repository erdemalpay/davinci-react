import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    additionalInvalidates: [[`${Paths.Accounting}/invoices`]],
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

export function useJoinProductsMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(joinProducts, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}

export function useGetAccountProducts() {
  return useGetList<AccountProduct>(baseUrl);
}

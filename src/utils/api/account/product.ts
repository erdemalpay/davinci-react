import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../../context/General.context";
import { AccountProduct } from "../../../types";
import { post } from ".././index";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/products`;
const allProductsBaseUrl = `${Paths.Accounting}/all-products`;
export interface CreateBulkProductAndMenuItem {
  name: string;
  expenseType?: string;
  brand?: string;
  vendor?: string;
  category?: string;
  price?: number;
  onlinePrice?: number;
  description?: string;
  image?: string;
  errorNote?: string;
}

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

export function createBulkProductAndMenuItem(
  createBulkPayload: CreateBulkProductAndMenuItem[]
) {
  return post({
    path: `${Paths.Accounting}/products/bulk`,
    payload: createBulkPayload,
  });
}

export function updateMultipleProduct(
  updateMultipleProductPayload: CreateBulkProductAndMenuItem[]
) {
  return post({
    path: `${Paths.Accounting}/products/update-multiple`,
    payload: updateMultipleProductPayload,
  });
}

export function updateProductsBaseQuantities(
  items: { [key: number]: string; name: string }[]
) {
  return post({
    path: `${Paths.Accounting}/product/update-base-quantities`,
    payload: items,
  });
}
export function useUpdateProductsBaseQuantities() {
  const queryKey = [allProductsBaseUrl];
  const queryClient = useQueryClient();
  return useMutation(updateProductsBaseQuantities, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useCreateBulkProductAndMenuItemMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  const { setErrorDataForProductBulkCreation } = useGeneralContext();
  return useMutation(createBulkProductAndMenuItem, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onSettled: (response) => {
      if (response) {
        setErrorDataForProductBulkCreation(
          response as CreateBulkProductAndMenuItem[]
        );
      }
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useUpdateMultipleProductMutations() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  const { setErrorDataForProductBulkCreation } = useGeneralContext();
  return useMutation(updateMultipleProduct, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onSettled: (response) => {
      if (response) {
        setErrorDataForProductBulkCreation(
          response as CreateBulkProductAndMenuItem[]
        );
      }
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
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
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useGetAccountProducts() {
  return useGetList<AccountProduct>(baseUrl);
}

export function useGetAllAccountProducts() {
  return useGetList<AccountProduct>(allProductsBaseUrl);
}

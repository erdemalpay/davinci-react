import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from "..";
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
  });

  return {
    deleteAccountBrand,
    updateAccountBrand,
    createAccountBrand,
  };
}

export function createMultipleBrand(items: { name: string }[]) {
  return post({
    path: `${Paths.Accounting}/brands/multiple`,
    payload: items,
  });
}
export function useCreateMultipleBrandMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(createMultipleBrand, {
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

export function useGetAccountBrands() {
  return useGetList<AccountBrand>(baseUrl);
}

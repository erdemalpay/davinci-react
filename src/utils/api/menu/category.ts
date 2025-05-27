import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch } from "..";
import { MenuCategory } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

export function useCategoryMutations() {
  const {
    deleteItem: deleteCategory,
    updateItem: updateCategory,
    createItem: createCategory,
  } = useMutationApi<MenuCategory>({
    baseQuery: Paths.MenuCategories,
  });

  return { deleteCategory, updateCategory, createCategory };
}

export function useGetCategories() {
  return useGetList<MenuCategory>(Paths.MenuCategories);
}
export function useGetAllCategories() {
  return useGetList<MenuCategory>(`${Paths.Menu}/categories-all`);
}

export function updateFarmCategory({
  id,
  updates,
}: {
  id: number;
  updates: Partial<MenuCategory>;
}) {
  return patch({
    path: `${Paths.Menu}/categories-farm/${id}`,
    payload: updates,
  });
}
export function useUpdateFarmCategoryMutation() {
  const queryKey = [`${Paths.MenuCategories}`];
  const queryClient = useQueryClient();
  return useMutation(updateFarmCategory, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
      queryClient.invalidateQueries(queryKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}

export function updateCategoriesOrder({
  id,
  newOrder,
}: {
  id: number;
  newOrder: number;
}) {
  return patch({
    path: `${Paths.Menu}/categories_order/${id}`,
    payload: { newOrder },
  });
}
export function useUpdateCategoriesOrderMutation() {
  const queryKey = [`${Paths.MenuCategories}`];
  const queryClient = useQueryClient();
  return useMutation(updateCategoriesOrder, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
      queryClient.invalidateQueries(queryKey);
    },
  });
}

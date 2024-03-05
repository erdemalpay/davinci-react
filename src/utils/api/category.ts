import { useQueryClient } from "@tanstack/react-query";
import { MenuCategory } from "../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const {
    deleteItem: deleteCategory,
    updateItem: updateCategory,
    createItem: createCategory,
  } = useMutationApi<MenuCategory>({
    baseQuery: Paths.MenuCategories,
    onSuccess: () => {
      queryClient.invalidateQueries([Paths.MenuItems]);
    },
  });

  return { deleteCategory, updateCategory, createCategory };
}

export function useGetCategories() {
  return useGetList<MenuCategory>(Paths.MenuCategories);
}

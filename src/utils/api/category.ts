import { MenuCategory } from "../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

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
  return useGetList<MenuCategory>(Paths.MenuCategories, [
    Paths.Menu,
    Paths.Categories,
  ]);
}

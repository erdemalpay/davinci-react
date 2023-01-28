import { Paths, useGet, useMutationApi } from "./factory";
import { MenuCategory } from "../../types/index";

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
  return useGet<MenuCategory>(Paths.MenuCategories, [
    Paths.Menu,
    Paths.Categories,
  ]);
}

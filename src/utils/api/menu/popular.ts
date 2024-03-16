import { MenuPopular } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

export function usePopularMutations() {
  const {
    deleteItem: deletePopular,
    updateItem: updatePopular,
    createItem: createPopular,
  } = useMutationApi<MenuPopular>({
    baseQuery: Paths.MenuPopular,
  });

  return { deletePopular, updatePopular, createPopular };
}

export function useGetPopularItems() {
  return useGetList<MenuPopular>(Paths.MenuPopular);
}

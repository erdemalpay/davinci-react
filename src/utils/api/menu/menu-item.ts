import { MenuItem } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

export function useMenuItemMutations() {
  return useMutationApi<MenuItem>({
    baseQuery: Paths.MenuItems,
    isInvalidate: true,
  });
}

export function useGetMenuItems() {
  return useGetList<MenuItem>(Paths.MenuItems);
}

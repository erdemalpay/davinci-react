import { MenuItem } from "../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useMenuItemMutations() {
  return useMutationApi<MenuItem>({
    baseQuery: Paths.MenuItems,
  });
}

export function useGetMenuItems() {
  return useGetList<MenuItem>(Paths.MenuItems, [Paths.Menu, Paths.Items]);
}

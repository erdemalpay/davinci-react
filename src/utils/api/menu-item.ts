import { Paths, useGet, useMutationApi } from "./factory";
import { MenuItem } from "../../types/index";

export function useMenuItemMutations(initialItems: MenuItem[] = []) {
  return useMutationApi<MenuItem>({
    baseQuery: Paths.MenuItems,
  });
}

export function useGetMenuItems() {
  return useGet<MenuItem[]>(Paths.MenuItems, [Paths.Menu, Paths.Items]);
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch } from "..";
import { MenuItem } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

export function useMenuItemMutations() {
  return useMutationApi<MenuItem>({
    baseQuery: Paths.MenuItems,
    // isInvalidate: true,
  });
}
export function updateItems(items: MenuItem[]) {
  return patch({
    path: `${Paths.MenuItems}/update_bulk`,
    payload: { items },
  });
}
export function useUpdateItemsMutation() {
  const queryKey = [`${Paths.MenuItems}`];
  const queryClient = useQueryClient();
  return useMutation(updateItems, {
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
      queryClient.invalidateQueries(queryKey);
    },
  });
}

export function useGetMenuItems() {
  // return useGetList<MenuItem>(Paths.MenuItems, [Paths.MenuItems], true);
  return useGetList<MenuItem>(Paths.MenuItems);
}

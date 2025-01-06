import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch, post } from "..";
import { MenuItem } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

interface CreateDamagedItem {
  itemId: number;
  stockQuantity: number;
  price: number;
  category: number;
  name: string;
  oldStockLocation: number;
  newStockLocation: number;
}

interface UpdateBulkItemsPayload {
  itemIds: number[];
  updates: Partial<MenuItem>;
}
export function useMenuItemMutations() {
  return useMutationApi<MenuItem>({
    baseQuery: Paths.MenuItems,
    // isInvalidate: true,
  });
}
export function updateBulkItems(payload: UpdateBulkItemsPayload) {
  return post({
    path: `${Paths.MenuItems}/update-bulk-items`,
    payload: payload,
  });
}

export function updateItems(items: MenuItem[]) {
  return patch({
    path: `${Paths.MenuItems}/update_bulk`,
    payload: { items },
  });
}
export function useUpdateBulkItemsMutation() {
  const queryKey = [`${Paths.MenuItems}`];
  const queryClient = useQueryClient();
  return useMutation(updateBulkItems, {
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
    },
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

export function updateItemsOrder({
  id,
  newOrder,
}: {
  id: number;
  newOrder: number;
}) {
  return patch({
    path: `${Paths.Menu}/items_order/${id}`,
    payload: { newOrder },
  });
}

export function createDamagedItem(payload: CreateDamagedItem) {
  return post({
    path: `${Paths.MenuItems}/create-damaged-item`,
    payload,
  });
}

export function useCreateDamagedItemMutation() {
  const queryKey = [`${Paths.MenuItems}`];
  const queryClient = useQueryClient();
  return useMutation(createDamagedItem, {
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
export function useUpdateItemsOrderMutation() {
  const queryKey = [`${Paths.MenuItems}`];
  const queryClient = useQueryClient();
  return useMutation(updateItemsOrder, {
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

export function useGetMenuItems() {
  // return useGetList<MenuItem>(Paths.MenuItems, [Paths.MenuItems], true);
  return useGetList<MenuItem>(Paths.MenuItems);
}

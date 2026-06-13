import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Location } from "../../types";
import { patch } from "./index";
import { Paths, useGetList, useMutationApi } from "./factory";

const baseUrl = Paths.Location;
export function useLocationMutations() {
  const { updateItem: updateLocation, createItem: createStockLocation } =
    useMutationApi<Location>({
      baseQuery: baseUrl,
      queryKey: [`${baseUrl}/all`],
    });
  return { updateLocation, createStockLocation };
}
export function useGetStoreLocations() {
  return useGetList<Location>(baseUrl);
}

export function useGetOrdersSummaryLocations() {
  const url = `${Paths.Location}/orders-summary`;
  return useGetList<Location>(url);
}

export function useGetStockLocations() {
  const url = `${Paths.Location}/stock`;
  return useGetList<Location>(url);
}

export function useGetSellLocations() {
  const url = `${Paths.Location}/sell`;
  return useGetList<Location>(url);
}

export function useGetAllLocations() {
  const url = `${Paths.Location}/all`;
  return useGetList<Location>(url);
}

export function updateLocationOrder({
  id,
  newOrder,
}: {
  id: number;
  newOrder: number;
}) {
  return patch({
    path: `${Paths.Location}/order/${id}`,
    payload: { newOrder },
  });
}

export function useUpdateLocationOrderMutation() {
  const queryKey = [`${Paths.Location}/all`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLocationOrder,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
      queryClient.invalidateQueries({ queryKey });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}

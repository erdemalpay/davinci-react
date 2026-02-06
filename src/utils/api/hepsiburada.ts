import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch, post } from ".";
import { Paths, useGetList } from "./factory";

export interface HepsiburadaListing {
  listingId: string;
  hepsiburadaSku: string;
  merchantSku: string;
  price: number;
  availableStock: number;
  isSalable: boolean;
  productId: string;
}

interface UpdateHepsiburadaProductPricePayload {
  hepsiburadaSku?: string;
  merchantSku?: string;
  price?: number;
}

export function useGetHepsiburadaListings() {
  return useGetList<HepsiburadaListing>(`${Paths.Hepsiburada}/listings`);
}

export function updateHepsiburadaProductPrice(
  payload: UpdateHepsiburadaProductPricePayload
) {
  return patch({
    path: `${Paths.Hepsiburada}/product-price`,
    payload: payload,
  });
}

export function updateAllHepsiburadaPrices() {
  return post({
    path: `${Paths.Hepsiburada}/update-all-prices`,
    payload: {},
  });
}

export function useUpdateHepsiburadaProductPriceMutation() {
  const queryKey = [`${Paths.Hepsiburada}/product-price`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHepsiburadaProductPrice,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },

    onError: (_err: unknown) => {
      const errorMessage =
        (_err as any)?.response?.data?.message ||
        "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useUpdateAllHepsiburadaPricesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAllHepsiburadaPrices,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`${Paths.Hepsiburada}/products`],
      });
      setTimeout(() => toast.success("Prices updated successfully"), 200);
    },
    onError: (_err: unknown) => {
      const errorMessage =
        (_err as any)?.response?.data?.message ||
        "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

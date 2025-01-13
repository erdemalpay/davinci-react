import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch } from ".";
import { IkasProduct } from "../../types";
import { Paths, useGetList } from "./factory";

interface UpdateIkasProductPayload {
  productId: string;
  stockLocationId: number;
  stockCount: number;
}
export function useGetIkasProducts() {
  return useGetList<IkasProduct>(`${Paths.Ikas}/product`);
}

export function updateIkasProductStock(payload: UpdateIkasProductPayload) {
  return patch({
    path: `${Paths.Ikas}/product-stock`,
    payload: payload,
  });
}

export function useUpdateIkasProductStockMutation() {
  const queryKey = [`${Paths.Ikas}/product-stock`];
  const queryClient = useQueryClient();
  return useMutation(updateIkasProductStock, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

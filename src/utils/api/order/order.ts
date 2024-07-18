import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Order } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { patch } from "../index";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
const baseUrl = `${Paths.Order}`;
export function useOrderMutations() {
  const {
    deleteItem: deleteOrder,
    updateItem: updateOrder,
    createItem: createOrder,
  } = useMutationApi<Order>({
    baseQuery: baseUrl,
    additionalInvalidates: [
      [`${Paths.Tables}`],
      [`${Paths.Order}/today`],
      [`${Paths.Order}/${formatDate(new Date())}`],
    ],
  });

  return { deleteOrder, updateOrder, createOrder };
}

export function deleteTableOrders({ ids }: { ids: number[] }) {
  return patch({
    path: `/order/delete_multiple`,
    payload: { ids },
  });
}
export function updateMultipleOrdersStatus({
  ids,
  status,
}: {
  ids: number[];
  status: string;
}) {
  return patch({
    path: `/order/update_multiple`,
    payload: { ids: ids, status: status },
  });
}
export function useUpdateMultipleOrderMutation() {
  const queryKey = [`${Paths.Order}/today`];
  const queryClient = useQueryClient();
  return useMutation(updateMultipleOrdersStatus, {
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

export function useGetOrders() {
  return useGetList<Order>(baseUrl);
}

export function useGetGivenDateOrders(date: Date) {
  const formattedDate = formatDate(date);
  return useGetList<Order>(`${baseUrl}/date/${formattedDate}`, [
    `${baseUrl}/${formattedDate}`,
  ]);
}

export function useGetTodayOrders() {
  return useGetList<Order>(`${baseUrl}/today`, [`${baseUrl}/today`]);
}

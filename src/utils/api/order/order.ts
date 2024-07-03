import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Order } from "../../../types";
import { formatAsLocalDate } from "../../format";
import { Paths, useGetList, useMutationApi } from "../factory";
import { patch } from "../index";

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
      [`${Paths.Order}/${formatAsLocalDate(new Date().toISOString())}`],
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
  const queryKey = [
    `${Paths.Order}/${formatAsLocalDate(new Date().toISOString())}`,
  ];
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
  return useGetList<Order>(`${baseUrl}/${date.toISOString().split("T")[0]}`, [
    `${baseUrl}/${formatAsLocalDate(date.toISOString())}`,
  ]);
}

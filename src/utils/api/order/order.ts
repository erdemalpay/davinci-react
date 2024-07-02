import { Order } from "../../../types";
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
    additionalInvalidates: [[`${Paths.Tables}`], [`${Paths.Order}/today`]],
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

export function useGetOrders() {
  return useGetList<Order>(baseUrl);
}

export function useGetTodayOrders() {
  return useGetList<Order>(`${baseUrl}/today`, [`${baseUrl}/today`]);
}

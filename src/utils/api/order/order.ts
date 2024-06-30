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
    additionalInvalidates: [[`${Paths.Tables}`]],
  });

  return { deleteOrder, updateOrder, createOrder };
}

export function deleteTableOrders({ ids }: { ids: number[] }) {
  return patch({
    path: `/order/multiple`,
    payload: { ids },
  });
}

export function useGetOrders() {
  return useGetList<Order>(baseUrl);
}

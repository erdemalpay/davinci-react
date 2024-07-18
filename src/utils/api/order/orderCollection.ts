import { OrderCollection } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Order}/collection`;
export function useOrderCollectionMutations() {
  const {
    deleteItem: deleteOrderCollection,
    updateItem: updateOrderCollection,
    createItem: createOrderCollection,
  } = useMutationApi<OrderCollection>({
    baseQuery: baseUrl,
    additionalInvalidates: [[`${Paths.Order}/payment`]],
  });
  return {
    deleteOrderCollection,
    updateOrderCollection,
    createOrderCollection,
  };
}

export function useGetOrderCollections() {
  return useGetList<OrderCollection>(baseUrl);
}

import { OrderCollection } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";

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
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  return useGetList<OrderCollection>(
    `${baseUrl}/date/?location=${selectedLocationId}&date=${selectedDate}`,
    [`${Paths.Order}/collection`, selectedLocationId, selectedDate]
  );
}
export function useGetAllOrderCollections() {
  return useGetList<OrderCollection>(baseUrl);
}

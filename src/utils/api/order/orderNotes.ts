import { OrderNote } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Order}/notes`;
export function useOrderNotesMutations() {
  const {
    deleteItem: deleteOrderNote,
    updateItem: updateOrderNote,
    createItem: createOrderNote,
  } = useMutationApi<OrderNote>({
    baseQuery: baseUrl,
  });
  return {
    deleteOrderNote,
    updateOrderNote,
    createOrderNote,
  };
}

export function useGetOrderNotes() {
  return useGetList<OrderNote>(baseUrl);
}

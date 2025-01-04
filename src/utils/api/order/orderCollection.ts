import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch, post, UpdatePayload } from "..";
import { useOrderContext } from "../../../context/Order.context";
import { Order, OrderCollection, OrderCollectionStatus } from "../../../types";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";

const collectionBaseUrl = `${Paths.Order}/collection/table`;
const orderBaseUrl = `${Paths.Order}/table`;

export function useOrderCollectionMutations(tableId: number) {
  const { deleteItem: deleteOrderCollection } = useMutationApi<OrderCollection>(
    {
      baseQuery: collectionBaseUrl,
      queryKey: [collectionBaseUrl, tableId],
    }
  );
  const { mutate: createOrderCollection } =
    useCreateOrderCollectionMutation(tableId);
  const { mutate: updateOrderCollection } =
    useUpdateOrderCollectionMutation(tableId);
  return {
    deleteOrderCollection,
    updateOrderCollection,
    createOrderCollection,
  };
}
export function useCollectionMutation() {
  const { updateItem: updateCollection } = useMutationApi<OrderCollection>({
    baseQuery: collectionBaseUrl,
    queryKey: [`${Paths.Order}/collection/query`],
    isInvalidate: true,
  });

  return { updateCollection };
}

export function useGetTableCollections(tableId: number) {
  return useGetList<OrderCollection>(`${collectionBaseUrl}/${tableId}`, [
    collectionBaseUrl,
    tableId,
  ]);
}

export function useGetAllOrderCollections() {
  const { filterPanelFormElements } = useOrderContext();
  let url = `${Paths.Order}/collection/query?after=${filterPanelFormElements.after}`;
  if (filterPanelFormElements?.before) {
    url = url.concat(`&before=${filterPanelFormElements.before}`);
  }
  return useGetList<OrderCollection>(url, [
    `${Paths.Order}/collection/query`,
    filterPanelFormElements.after,
    filterPanelFormElements.before,
  ]);
}
export function useGetSummaryCollectionTotal() {
  const { filterSummaryFormElements } = useOrderContext();
  return useGet<number>(
    `${Paths.Order}/collection/summary/query?after=${
      filterSummaryFormElements.after
    }&before=${filterSummaryFormElements.before}&location=${Number(
      filterSummaryFormElements.location
    )}`
  );
}

function createRequest(
  itemDetails: Partial<OrderCollection>
): Promise<OrderCollection> {
  return post<Partial<OrderCollection>, OrderCollection>({
    path: `${collectionBaseUrl}`,
    payload: itemDetails,
  });
}

function updateRequest(
  updatePayload: UpdatePayload<OrderCollection>
): Promise<OrderCollection> {
  const { id, updates } = updatePayload;
  return patch<Partial<OrderCollection>, OrderCollection>({
    path: `${collectionBaseUrl}/${id}`,
    payload: updates,
  });
}

export function useCreateOrderCollectionMutation(tableId: number) {
  const queryClient = useQueryClient();

  const collectionQueryKey = [collectionBaseUrl, tableId];
  const orderQueryKey = [orderBaseUrl, tableId];

  return useMutation(createRequest, {
    // We are updating tables query data with new table
    onMutate: async (createdCollection: Partial<OrderCollection>) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(collectionQueryKey);
      await queryClient.cancelQueries(orderQueryKey);

      // Snapshot the previous value
      const previousCollections =
        queryClient.getQueryData<OrderCollection[]>(collectionQueryKey) || [];
      const updatedCollections: OrderCollection[] = JSON.parse(
        JSON.stringify(previousCollections)
      );
      updatedCollections.push(createdCollection as OrderCollection);

      // Optimistically update to the new value
      queryClient.setQueryData(collectionQueryKey, updatedCollections);

      const { orders, newOrders } = createdCollection;

      const previousOrderData =
        queryClient.getQueryData<Order[]>(orderQueryKey) || [];
      if (!orders) {
        return { previousCollections, previousOrderData };
      }

      /* const updatedOrderData: Order[] = JSON.parse(
        JSON.stringify(previousOrderData)
      );
      const mergedData = updatedOrderData.map((order) => {
        // Attempt to find a matching item in the 'orders' array
        const updatedOrder = orders.find((item) => item.order === order._id);
        if (updatedOrder) {
          return { ...order, paidQuantity: updatedOrder.paidQuantity };
        }
        // If an updated order exists, return it, otherwise return the original order
        return order;
      }); */

      // Optimistically update to the new value
      if (orders && orders?.length > 0) {
        queryClient.setQueryData<Order[]>(orderQueryKey, newOrders);
      }

      // Return a context object with the snapshotted value
      return {
        previousCollections,
        previousOrderData,
      };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _newTable, context) => {
      const previousContext = context as {
        previousCollections: OrderCollection[];
        previousOrderData: Order[];
      };
      if (previousContext?.previousCollections) {
        const { previousCollections, previousOrderData } = previousContext;
        queryClient.setQueryData<OrderCollection[]>(
          collectionQueryKey,
          previousCollections
        );
        queryClient.setQueryData<Order[]>(orderQueryKey, previousOrderData);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useUpdateOrderCollectionMutation(tableId: number) {
  const collectionQueryKey = [collectionBaseUrl, tableId];
  const orderQueryKey = [orderBaseUrl, tableId];
  const queryClient = useQueryClient();
  return useMutation(updateRequest, {
    // We are updating tables query data with new table
    onMutate: async ({ id, updates }: UpdatePayload<OrderCollection>) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(collectionQueryKey);
      await queryClient.cancelQueries(orderQueryKey);

      // Snapshot the previous value
      const previousCollections =
        queryClient.getQueryData<OrderCollection[]>(collectionQueryKey) || [];
      const updatedCollections = previousCollections.map((collection) => {
        if (collection._id === id) {
          return { ...collection, status: OrderCollectionStatus.CANCELLED };
        }
        return collection;
      });

      // Optimistically update to the new value
      queryClient.setQueryData(collectionQueryKey, updatedCollections);

      const { table, newOrders } = updates;

      const previousOrders =
        queryClient.getQueryData<Order[]>(orderQueryKey) || [];
      if (!newOrders) {
        return { previousCollections, previousOrders };
      }

      const updatedOrders: Order[] = JSON.parse(JSON.stringify(previousOrders));

      const tableIndex = updatedOrders.findIndex((t) => t._id === table);
      const tableToUpdate = updatedOrders[tableIndex];
      // for (const orderItem of newOrders) {
      //   if (!tableToUpdate.orders) continue;
      //   const tableOrder = tableToUpdate.orders.find(
      //     (order) => (order as Order)._id === orderItem._id
      //   );
      //   (tableOrder as Order).paidQuantity = orderItem.paidQuantity;
      //   updatedTables.splice(tableIndex, 1, tableToUpdate);
      // }
      // Optimistically update to the new value
      queryClient.setQueryData<Order[]>(orderQueryKey, updatedOrders);

      // Return a context object with the snapshotted value
      return { previousCollections, previousTables: previousOrders };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _newTable, context) => {
      const previousContext = context as {
        previousCollections: OrderCollection[];
        previousOrders: Order[];
      };
      if (previousContext?.previousCollections) {
        const { previousCollections, previousOrders } = previousContext;
        queryClient.setQueryData<OrderCollection[]>(
          collectionQueryKey,
          previousCollections
        );
        queryClient.setQueryData<Order[]>(orderQueryKey, previousOrders);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Always refetch after error or success:
    // onSettled: () => {
    //   queryClient.invalidateQueries(collectionQueryKey);
    // },
  });
}

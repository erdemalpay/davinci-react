import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { UpdatePayload, patch, post } from "..";
import {
  Order,
  OrderCollection,
  OrderCollectionStatus,
  Table,
} from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";

const collectionBaseUrl = `${Paths.Order}/collection`;
const tableBaseUrl = `${Paths.Tables}`;
export function useOrderCollectionMutations() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const { deleteItem: deleteOrderCollection } = useMutationApi<OrderCollection>(
    {
      baseQuery: collectionBaseUrl,
      queryKey: [
        `${Paths.Order}/collection/date`,
        selectedLocationId,
        selectedDate,
      ],
    }
  );
  const { mutate: createOrderCollection } = useCreateOrderCollectionMutation();
  const { mutate: updateOrderCollection } = useUpdateOrderCollectionMutation();
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
    `${collectionBaseUrl}/date/?location=${selectedLocationId}&date=${selectedDate}`,
    [`${Paths.Order}/collection/date`, selectedLocationId, selectedDate]
  );
}
export function useGetAllOrderCollections() {
  return useGetList<OrderCollection>(collectionBaseUrl);
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

export function useCreateOrderCollectionMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const collectionQueryKey = [
    `${Paths.Order}/collection/date`,
    selectedLocationId,
    selectedDate,
  ];
  const tableQueryKey = [tableBaseUrl, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();
  return useMutation(createRequest, {
    // We are updating tables query data with new table
    onMutate: async (createdCollection: Partial<OrderCollection>) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(collectionQueryKey);
      await queryClient.cancelQueries(tableQueryKey);

      // Snapshot the previous value
      const previousCollections =
        queryClient.getQueryData<OrderCollection[]>(collectionQueryKey) || [];
      const updatedCollections: OrderCollection[] = JSON.parse(
        JSON.stringify(previousCollections)
      );
      updatedCollections.push(createdCollection as OrderCollection);

      console.log({
        collectionQueryKey,
        previousCollections,
        updatedCollections,
      });
      // Optimistically update to the new value
      queryClient.setQueryData(collectionQueryKey, updatedCollections);

      const { table, orders } = createdCollection;

      const previousTables =
        queryClient.getQueryData<Table[]>(tableQueryKey) || [];
      if (!orders) {
        return { previousCollections, previousTables };
      }

      const updatedTables: Table[] = JSON.parse(JSON.stringify(previousTables));

      const tableIndex = updatedTables.findIndex((t) => t._id === table);
      const tableToUpdate = updatedTables[tableIndex];
      for (const orderItem of orders) {
        if (!tableToUpdate.orders) continue;
        const tableOrder = tableToUpdate.orders.find(
          (order) => (order as Order)._id === orderItem.order
        );
        (tableOrder as Order).paidQuantity += orderItem.paidQuantity;
        updatedTables.splice(tableIndex, 1, tableToUpdate);
      }
      // Optimistically update to the new value
      queryClient.setQueryData<Table[]>(tableQueryKey, updatedTables);

      // Return a context object with the snapshotted value
      return { previousCollections, previousTables };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _newTable, context) => {
      const previousContext = context as {
        previousCollections: OrderCollection[];
        previousTables: Table[];
      };
      if (previousContext?.previousCollections) {
        const { previousCollections, previousTables } = previousContext;
        queryClient.setQueryData<OrderCollection[]>(
          collectionQueryKey,
          previousCollections
        );
        queryClient.setQueryData<Table[]>(tableQueryKey, previousTables);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(collectionQueryKey);
    },
  });
}

export function useUpdateOrderCollectionMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const collectionQueryKey = [
    `${Paths.Order}/collection/date`,
    selectedLocationId,
    selectedDate,
  ];
  const tableQueryKey = [tableBaseUrl, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();
  return useMutation(updateRequest, {
    // We are updating tables query data with new table
    onMutate: async ({ id, updates }: UpdatePayload<OrderCollection>) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(collectionQueryKey);
      await queryClient.cancelQueries(tableQueryKey);

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

      const previousTables =
        queryClient.getQueryData<Table[]>(tableQueryKey) || [];
      if (!newOrders) {
        return { previousCollections, previousTables };
      }

      const updatedTables: Table[] = JSON.parse(JSON.stringify(previousTables));

      const tableIndex = updatedTables.findIndex((t) => t._id === table);
      const tableToUpdate = updatedTables[tableIndex];
      for (const orderItem of newOrders) {
        if (!tableToUpdate.orders) continue;
        const tableOrder = tableToUpdate.orders.find(
          (order) => (order as Order)._id === orderItem._id
        );
        (tableOrder as Order).paidQuantity = orderItem.paidQuantity;
        updatedTables.splice(tableIndex, 1, tableToUpdate);
      }
      // Optimistically update to the new value
      queryClient.setQueryData<Table[]>(tableQueryKey, updatedTables);

      // Return a context object with the snapshotted value
      return { previousCollections, previousTables };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _newTable, context) => {
      const previousContext = context as {
        previousCollections: OrderCollection[];
        previousTables: Table[];
      };
      if (previousContext?.previousCollections) {
        const { previousCollections, previousTables } = previousContext;
        queryClient.setQueryData<OrderCollection[]>(
          collectionQueryKey,
          previousCollections
        );
        queryClient.setQueryData<Table[]>(tableQueryKey, previousTables);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(collectionQueryKey);
    },
  });
}

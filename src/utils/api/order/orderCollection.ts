import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch, post, UpdatePayload } from "..";
import { useDateContext } from "../../../context/Date.context";
import { useOrderContext } from "../../../context/Order.context";
import {
  Order,
  OrderCollection,
  OrderCollectionStatus,
  Table,
} from "../../../types";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";

const collectionBaseUrl = `${Paths.Order}/collection/table`;
const orderBaseUrl = `${Paths.Order}/table`;
export type PersonalCollectionNumber = {
  createdBy: string;
  totalCollections: number;
};
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

export function useGetPersonalCollectionDatas() {
  const { filterPanelFormElements } = useOrderContext();
  let url = `${Paths.Order}/personal_collection?after=${filterPanelFormElements.after}`;
  if (filterPanelFormElements?.before) {
    url = url.concat(`&before=${filterPanelFormElements.before}`);
  }
  return useGetList<PersonalCollectionNumber>(
    url,
    [
      `${Paths.Order}/personal_collection`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
    ],
    true
  );
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
  if (
    filterPanelFormElements?.location &&
    filterPanelFormElements?.location !== ""
  ) {
    url = url.concat(`&location=${filterPanelFormElements.location}`);
  }
  return useGetList<OrderCollection>(
    url,
    [
      `${Paths.Order}/collection/query`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
      filterPanelFormElements.location,
    ],
    true
  );
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
export function useGetTodayCollections() {
  const { selectedDate } = useDateContext();
  return useGetList<OrderCollection>(
    `${Paths.Order}/collection/today?after=${selectedDate}`,
    [`${Paths.Order}/collection/today`, selectedDate],
    false,
    {
      refetchOnWindowFocus: true,
    }
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
  const { selectedDate } = useDateContext();

  const collectionQueryKey = [collectionBaseUrl, tableId];
  const orderQueryKey = [orderBaseUrl, tableId];
  const todayOrdersQueryKey = [`${Paths.Order}/today`, selectedDate];
  const todayCollectionsQueryKey = [
    `${Paths.Order}/collection/today`,
    selectedDate,
  ];

  return useMutation(createRequest, {
    // We are updating tables query data with new table
    onMutate: async (createdCollection: Partial<OrderCollection>) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(collectionQueryKey);
      await queryClient.cancelQueries(orderQueryKey);
      await queryClient.cancelQueries(todayOrdersQueryKey);
      await queryClient.cancelQueries(todayCollectionsQueryKey);

      // Snapshot the previous value
      const previousCollections =
        queryClient.getQueryData<OrderCollection[]>(collectionQueryKey) || [];
      const updatedCollections: OrderCollection[] = JSON.parse(
        JSON.stringify(previousCollections)
      );
      updatedCollections.push(createdCollection as OrderCollection);

      // Optimistically update to the new value
      queryClient.setQueryData(collectionQueryKey, updatedCollections);

      // Update today collections cache
      const previousTodayCollections =
        queryClient.getQueryData<OrderCollection[]>(todayCollectionsQueryKey) ||
        [];
      const updatedTodayCollections: OrderCollection[] = JSON.parse(
        JSON.stringify(previousTodayCollections)
      );
      updatedTodayCollections.push(createdCollection as OrderCollection);
      queryClient.setQueryData(
        todayCollectionsQueryKey,
        updatedTodayCollections
      );

      const { orders, newOrders } = createdCollection;

      const previousOrderData =
        queryClient.getQueryData<Order[]>(orderQueryKey) || [];
      const previousTodayOrders =
        queryClient.getQueryData<Order[]>(todayOrdersQueryKey) || [];

      // Update today orders cache immediately if newOrders exist
      if (newOrders && newOrders.length > 0) {
        const updatedTodayOrdersInitial = previousTodayOrders.map((order) => {
          const match = newOrders.find((n) => n._id === order._id);
          return match ? { ...order, paidQuantity: match.paidQuantity } : order;
        });
        queryClient.setQueryData<Order[]>(
          todayOrdersQueryKey,
          updatedTodayOrdersInitial
        );
      }

      if (!orders) {
        return {
          previousCollections,
          previousOrderData,
          previousTodayOrders,
          previousTodayCollections,
        };
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

      // Update today orders cache with properly populated table data
      if (newOrders && newOrders.length > 0) {
        queryClient.setQueryData<Order[]>(todayOrdersQueryKey, (oldData) => {
          if (!oldData) return oldData;

          // Get tables data to populate table information
          const tablesData = queryClient.getQueryData<Record<string, Table[]>>([
            Paths.Tables,
            selectedDate,
          ]);

          const updatedOrders = [...oldData];

          newOrders.forEach((newOrder: Order) => {
            const orderIndex = updatedOrders.findIndex(
              (order) => order._id === newOrder._id
            );

            // Prepare the normalized order with populated table
            const normalizedOrder = { ...newOrder };

            // If table is just a number ID, fetch the full table object
            if (typeof newOrder.table === "number" && tablesData) {
              let foundTable = null;
              for (const locationTables of Object.values(tablesData)) {
                foundTable = locationTables.find(
                  (t) => t?._id === newOrder.table
                );
                if (foundTable) break;
              }

              if (foundTable) {
                normalizedOrder.table = foundTable;
              }
            }

            // Ensure item and kitchen are IDs, not objects
            const orderWithPossibleObjects = newOrder as unknown as {
              item: number | { _id: number };
              kitchen?: string | { _id: string };
            };
            if (
              typeof orderWithPossibleObjects.item === "object" &&
              orderWithPossibleObjects.item?._id
            ) {
              normalizedOrder.item = orderWithPossibleObjects.item._id;
            }
            if (
              typeof orderWithPossibleObjects.kitchen === "object" &&
              orderWithPossibleObjects.kitchen?._id
            ) {
              normalizedOrder.kitchen = orderWithPossibleObjects.kitchen._id;
            }

            // Update existing order or keep it unchanged
            if (orderIndex !== -1) {
              updatedOrders[orderIndex] = normalizedOrder;
            }
          });

          return updatedOrders;
        });
      }

      // Return a context object with the snapshotted value
      return {
        previousCollections,
        previousOrderData,
        previousTodayOrders,
        previousTodayCollections,
      };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: unknown, _newTable, context) => {
      const previousContext = context as {
        previousCollections: OrderCollection[];
        previousOrderData: Order[];
        previousTodayOrders: Order[];
        previousTodayCollections: OrderCollection[];
      };
      if (previousContext?.previousCollections) {
        const {
          previousCollections,
          previousOrderData,
          previousTodayOrders,
          previousTodayCollections,
        } = previousContext;
        queryClient.setQueryData<OrderCollection[]>(
          collectionQueryKey,
          previousCollections
        );
        queryClient.setQueryData<Order[]>(orderQueryKey, previousOrderData);
        if (previousTodayOrders) {
          queryClient.setQueryData<Order[]>(
            todayOrdersQueryKey,
            previousTodayOrders
          );
        }
        if (previousTodayCollections) {
          queryClient.setQueryData<OrderCollection[]>(
            todayCollectionsQueryKey,
            previousTodayCollections
          );
        }
      }
      const errorMessage =
        (_err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useUpdateOrderCollectionMutation(tableId: number) {
  const collectionQueryKey = [collectionBaseUrl, tableId];
  const orderQueryKey = [orderBaseUrl, tableId];
  const queryClient = useQueryClient();
  const { selectedDate } = useDateContext();
  const tableOrderQueryKey = [`${Paths.Order}/table`, tableId];
  const todayOrdersQueryKey = [`${Paths.Order}/today`, selectedDate];
  const todayCollectionsQueryKey = [
    `${Paths.Order}/collection/today`,
    selectedDate,
  ];

  return useMutation(updateRequest, {
    // We are updating tables query data with new table
    onMutate: async ({ id, updates }: UpdatePayload<OrderCollection>) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(collectionQueryKey);
      await queryClient.cancelQueries(orderQueryKey);
      await queryClient.cancelQueries(tableOrderQueryKey);
      await queryClient.cancelQueries(todayOrdersQueryKey);
      await queryClient.cancelQueries(todayCollectionsQueryKey);

      const previousTableOrders =
        queryClient.getQueryData<Order[]>(tableOrderQueryKey) || [];
      const previousTodayOrders =
        queryClient.getQueryData<Order[]>(todayOrdersQueryKey) || [];

      const updatedTableOrders = previousTableOrders.map((order) => {
        const match = updates?.newOrders?.find((n) => n._id === order._id);
        return match ? { ...order, paidQuantity: match.paidQuantity } : order;
      });

      //update the table orders
      queryClient.setQueryData<Order[]>(tableOrderQueryKey, updatedTableOrders);

      // Update today orders with same logic
      const updatedTodayOrdersInitial = previousTodayOrders.map((order) => {
        const match = updates?.newOrders?.find((n) => n._id === order._id);
        return match ? { ...order, paidQuantity: match.paidQuantity } : order;
      });
      queryClient.setQueryData<Order[]>(
        todayOrdersQueryKey,
        updatedTodayOrdersInitial
      );

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

      // Update today collections cache
      const previousTodayCollections =
        queryClient.getQueryData<OrderCollection[]>(todayCollectionsQueryKey) ||
        [];
      const updatedTodayCollections = previousTodayCollections.map(
        (collection) => {
          if (collection._id === id) {
            return { ...collection, status: OrderCollectionStatus.CANCELLED };
          }
          return collection;
        }
      );
      queryClient.setQueryData(
        todayCollectionsQueryKey,
        updatedTodayCollections
      );

      const { newOrders } = updates;

      const previousOrders =
        queryClient.getQueryData<Order[]>(orderQueryKey) || [];
      if (!newOrders) {
        return {
          previousCollections,
          previousTables: previousOrders,
          previousTableOrders,
          previousTodayOrders,
          previousTodayCollections,
        };
      }

      const updatedOrders: Order[] = JSON.parse(JSON.stringify(previousOrders));

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

      // Update today orders cache with properly populated table data
      if (newOrders && newOrders.length > 0) {
        queryClient.setQueryData<Order[]>(todayOrdersQueryKey, (oldData) => {
          if (!oldData) return oldData;

          // Get tables data to populate table information
          const tablesData = queryClient.getQueryData<Record<string, Table[]>>([
            Paths.Tables,
            selectedDate,
          ]);

          const updatedTodayOrders = [...oldData];

          newOrders.forEach((newOrder: Order) => {
            const orderIndex = updatedTodayOrders.findIndex(
              (order) => order._id === newOrder._id
            );

            // Prepare the normalized order with populated table
            const normalizedOrder = { ...newOrder };

            // If table is just a number ID, fetch the full table object
            if (typeof newOrder.table === "number" && tablesData) {
              let foundTable = null;
              for (const locationTables of Object.values(tablesData)) {
                foundTable = locationTables.find(
                  (t) => t?._id === newOrder.table
                );
                if (foundTable) break;
              }

              if (foundTable) {
                normalizedOrder.table = foundTable;
              }
            }

            // Ensure item and kitchen are IDs, not objects
            const orderWithPossibleObjects = newOrder as unknown as {
              item: number | { _id: number };
              kitchen?: string | { _id: string };
            };
            if (
              typeof orderWithPossibleObjects.item === "object" &&
              orderWithPossibleObjects.item?._id
            ) {
              normalizedOrder.item = orderWithPossibleObjects.item._id;
            }
            if (
              typeof orderWithPossibleObjects.kitchen === "object" &&
              orderWithPossibleObjects.kitchen?._id
            ) {
              normalizedOrder.kitchen = orderWithPossibleObjects.kitchen._id;
            }

            // Update existing order
            if (orderIndex !== -1) {
              updatedTodayOrders[orderIndex] = normalizedOrder;
            }
          });

          return updatedTodayOrders;
        });
      }

      // Return a context object with the snapshotted value
      return {
        previousCollections,
        previousTables: previousOrders,
        previousTableOrders,
        previousTodayOrders,
        previousTodayCollections,
      };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: unknown, _newTable, context) => {
      const previousContext = context as {
        previousCollections: OrderCollection[];
        previousTables: Order[];
        previousTableOrders: Order[];
        previousTodayOrders: Order[];
        previousTodayCollections: OrderCollection[];
      };
      if (previousContext?.previousCollections) {
        const { previousCollections, previousTables } = previousContext;
        queryClient.setQueryData<OrderCollection[]>(
          collectionQueryKey,
          previousCollections
        );
        queryClient.setQueryData<Order[]>(orderQueryKey, previousTables);
      }
      if (context?.previousTableOrders) {
        queryClient.setQueryData<Order[]>(
          [`${Paths.Order}/table`, tableId],
          context.previousTableOrders
        );
      }
      if (context?.previousTodayOrders) {
        queryClient.setQueryData<Order[]>(
          todayOrdersQueryKey,
          context.previousTodayOrders
        );
      }
      if (context?.previousTodayCollections) {
        queryClient.setQueryData<OrderCollection[]>(
          todayCollectionsQueryKey,
          context.previousTodayCollections
        );
      }
      const errorMessage =
        (_err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Always refetch after error or success:
    // onSettled: () => {
    //   queryClient.invalidateQueries(collectionQueryKey);
    // },
  });
}

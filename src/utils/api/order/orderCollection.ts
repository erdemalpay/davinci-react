import { useQueryClient } from "@tanstack/react-query";
import { Order, OrderCollection, Table } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";

const baseUrl = `${Paths.Order}/collection`;

export function useOrderCollectionMutations() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryClient = useQueryClient();
  const {
    deleteItem: deleteOrderCollection,
    updateItem: updateOrderCollection,
    createItem: createOrderCollection,
  } = useMutationApi<OrderCollection>({
    baseQuery: baseUrl,
    additionalOnMutateFunction: (item: any) => {
      if (item?.newOrders) {
        const previousTables = queryClient.getQueryData<any[]>([
          Paths.Tables,
          selectedLocationId,
          selectedDate,
        ]);
        const updatedTables = previousTables?.map((table) => {
          if (table._id === item.table) {
            const filteredOrders = table.orders.filter(
              (order: Order) =>
                !item.newOrders.find(
                  (newOrder: Order) => newOrder._id === order._id
                )
            );
            return {
              ...table,
              orders: [...filteredOrders, ...item.newOrders],
            };
          }
          return table;
        });
        queryClient.setQueryData<Table[]>(
          [Paths.Tables, selectedLocationId, selectedDate],
          updatedTables
        );
      }
    },
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
    [`${Paths.Order}/collection/date`, selectedLocationId, selectedDate]
  );
}
export function useGetAllOrderCollections() {
  return useGetList<OrderCollection>(baseUrl);
}

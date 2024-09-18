import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Paths, useGetList, useMutationApi } from "../factory";
import { patch, post } from "../index";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";
import { Order, Table } from "./../../../types/index";

interface CreateOrderForDiscount {
  orders: {
    totalQuantity: number;
    selectedQuantity: number;
    orderId: number;
  }[];
  discount: number;
  discountPercentage?: number;
  discountAmout?: number;
}
interface CreateOrderForDivide {
  orders: {
    totalQuantity: number;
    selectedQuantity: number;
    orderId: number;
  }[];
}
interface TransferTablePayload {
  orders: Order[];
  oldTableId: number;
  transferredTableId: number;
}
interface CancelOrderForDiscount {
  orderId: number;
  cancelQuantity: number;
}
interface UpdateMultipleOrder {
  ids: number[];
  updates: Partial<Order>;
}

const baseUrl = `${Paths.Order}`;
export function useOrderMutations() {
  const { updateItem: updateOrder, createItem: createOrder } =
    useMutationApi<Order>({
      baseQuery: baseUrl,
      isAdditionalInvalidate: true,
      additionalInvalidates: [[`${Paths.Order}/today`]],
    });

  return { updateOrder, createOrder };
}

export function deleteTableOrders({ ids }: { ids: number[] }) {
  return patch({
    path: `/order/delete_multiple`,
    payload: { ids },
  });
}
export function updateOrders(orders: Order[]) {
  return patch({
    path: `/order/update_bulk`,
    payload: { orders },
  });
}
export function transferTable(payload: TransferTablePayload) {
  return post({
    path: `/order/table_transfer`,
    payload: payload,
  });
}
export function useTransferTableMutation() {
  const tableBaseUrl = `${Paths.Tables}`;
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [tableBaseUrl, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();

  return useMutation(transferTable, {
    onMutate: async ({
      orders,
      oldTableId,
      transferredTableId,
    }: TransferTablePayload) => {
      // Cancel any outgoing refetches to prevent overwriting the optimistic update
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousTables = queryClient.getQueryData<Table[]>(queryKey) || [];

      // Create a deep copy of the tables to avoid mutating the original data
      const updatedTables: Table[] = JSON.parse(JSON.stringify(previousTables));

      const oldTable = updatedTables.find((table) => table._id === oldTableId);
      const newTable = updatedTables.find(
        (table) => table._id === transferredTableId
      );

      if (oldTable && newTable) {
        newTable.gameplays = [
          ...(newTable.gameplays || []),
          ...(oldTable.gameplays || []),
        ];

        newTable.orders = [
          ...((newTable.orders as any) || []),
          ...(oldTable.orders || []),
        ];

        // Filter out the old table and the new table (which will be re-added with updated values)
        const remainingTables = updatedTables.filter(
          (table) =>
            table._id !== oldTableId && table._id !== transferredTableId
        );

        // Update the tables list with the new state of the transferred table
        queryClient.setQueryData<Table[]>(queryKey, [
          ...remainingTables,
          newTable,
        ]);
      }

      // Return the previous state in case of rollback
      return { previousTables };
    },
    onError: (_err: any, _newTable, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData<Table[]>(queryKey, context.previousTables);
      }

      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}

export function useUpdateOrdersMutation() {
  const queryKey = [`${Paths.Order}/today`];
  const queryClient = useQueryClient();
  return useMutation(updateOrders, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useGetTableOrders(tableId: number) {
  return useGetList<Order>(`${baseUrl}/table/${tableId}`, [
    `${Paths.Order}/table/${tableId}`,
    tableId,
  ]);
}

export function updateMultipleOrders(payload: UpdateMultipleOrder) {
  return patch({
    path: `/order/update_multiple`,
    payload,
  });
}
export function useUpdateMultipleOrderMutation() {
  const queryKey = [`${Paths.Order}/today`];
  const queryClient = useQueryClient();
  return useMutation(updateMultipleOrders, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
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

export function createOrderForDiscount(payload: CreateOrderForDiscount) {
  return post<CreateOrderForDiscount, Order>({
    path: `${Paths.Order}/create_order_for_discount`,
    payload,
  });
}
export function useCreateOrderForDiscountMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(createOrderForDiscount, {
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
export function cancelOrderForDiscount(payload: CancelOrderForDiscount) {
  return post<CancelOrderForDiscount, Order>({
    path: `${Paths.Order}/cancel_discount`,
    payload,
  });
}
export function useCancelOrderForDiscountMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(cancelOrderForDiscount, {
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

export function useGetTodayOrders() {
  return useGetList<Order>(`${baseUrl}/today`, [`${baseUrl}/today`]);
}

export function createOrderForDivide(payload: CreateOrderForDivide) {
  return post<CreateOrderForDivide, Order>({
    path: `${Paths.Order}/divide`,
    payload,
  });
}
export function useCreateOrderForDivideMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(createOrderForDivide, {
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

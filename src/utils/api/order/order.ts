import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Paths, useGetList, useMutationApi } from "../factory";
import { patch, post } from "../index";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";
import { useOrderContext } from "./../../../context/Order.context";
import { Order, PersonalOrderDataType, Table } from "./../../../types/index";

interface CreateOrderForDiscount {
  orders: {
    totalQuantity: number;
    selectedQuantity: number;
    orderId: number;
  }[];
  discount: number;
  discountPercentage?: number;
  discountAmout?: number;
  discountNote?: string;
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
interface ReturnOrderPayload {
  orderId: number;
  returnQuantity: number;
  paymentMethod: string;
}
interface CreateMultipleOrderPayload {
  orders: Partial<Order>[];
  table: Table;
}
interface SelectedOrderTransferPayload {
  orders: {
    totalQuantity: number;
    selectedQuantity: number;
    orderId: number;
  }[];
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
interface CancelIkasOrder {
  ikasId: string;
}

const baseUrl = `${Paths.Order}`;
export function useOrderMutations() {
  const { updateItem: updateOrder, createItem: createOrder } =
    useMutationApi<Order>({
      baseQuery: baseUrl,
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

export function returnOrder(payload: ReturnOrderPayload) {
  return post({
    path: `/order/return_order`,
    payload: payload,
  });
}
export function updateOrderForCancel(payload: {
  id: number;
  updates: Partial<Order>;
  tableId: number;
}) {
  return patch({
    path: `/order/${payload.id}`,
    payload: payload.updates,
  });
}
export function useUpdateOrderForCancelMutation() {
  const queryClient = useQueryClient();
  return useMutation(updateOrderForCancel, {
    onMutate: async (payload) => {
      const queryKey = [`${Paths.Order}/table`, payload.tableId];
      // Cancel any outgoing refetches to prevent overwriting the optimistic update
      await queryClient.cancelQueries(queryKey);
      // Snapshot the previous value
      const previousTableOrders =
        queryClient.getQueryData<Order[]>(queryKey) || [];
      //remove the order from the table
      const updatedTableOrders = previousTableOrders.filter(
        (order) => order._id !== payload.id
      );
      //update the table orders
      queryClient.setQueryData<Order[]>(queryKey, updatedTableOrders);

      // Return the previous state in case of rollback
      return { previousTableOrders, tableId: payload.tableId };
    },
    onError: (_err: any, _newTable, context) => {
      if (context?.previousTableOrders) {
        queryClient.setQueryData<Order[]>(
          [`${baseUrl}/table/${context.tableId}`],
          context.previousTableOrders
        );
      }

      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
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
export function selectedOrderTransfer(payload: SelectedOrderTransferPayload) {
  return post({
    path: `/order/selected_order_transfer`,
    payload: payload,
  });
}
export function useSelectedOrderTransferMutation() {
  return useMutation(selectedOrderTransfer, {
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
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
export function useReturnOrdersMutation() {
  const queryClient = useQueryClient();
  return useMutation(returnOrder, {
    onMutate: async () => {
      queryClient.invalidateQueries([`${Paths.Order}/query`]);
      queryClient.invalidateQueries([`${Paths.Order}/collection/query`]);
    },
    onSettled: () => {
      queryClient.invalidateQueries([`${Paths.Order}/query`]);
      queryClient.invalidateQueries([`${Paths.Order}/collection/query`]);
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
    `${Paths.Order}/table`,
    tableId,
  ]);
}

export function useGetPersonalOrderDatas() {
  const { filterPanelFormElements } = useOrderContext();
  return useGetList<PersonalOrderDataType>(
    `${baseUrl}/personal?after=${filterPanelFormElements.after}&before=${filterPanelFormElements.before}&eliminatedDiscounts=${filterPanelFormElements.eliminatedDiscounts}`,
    [
      `${Paths.Order}/personal`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
      filterPanelFormElements.eliminatedDiscounts,
    ]
  );
}

export function updateMultipleOrders(payload: UpdateMultipleOrder) {
  return patch({
    path: `/order/update_multiple`,
    payload,
  });
}
export function createMultipleOrder(payload: CreateMultipleOrderPayload) {
  return post({
    path: `/order/create_multiple`,
    payload,
  });
}
export function cancelIkasOrder(payload: CancelIkasOrder) {
  return post({
    path: `/order/cancel-ikas-order`,
    payload,
  });
}
export function useCancelIkasOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation(cancelIkasOrder, {
    onMutate: async () => {
      queryClient.invalidateQueries([`${Paths.Order}/query`]);
      queryClient.invalidateQueries([`${Paths.Order}/collection/query`]);
    },
    onSettled: () => {
      queryClient.invalidateQueries([`${Paths.Order}/query`]);
      queryClient.invalidateQueries([`${Paths.Order}/collection/query`]);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useCreateMultipleOrderMutation() {
  const queryKey = [`${Paths.Order}/today`];
  const queryClient = useQueryClient();
  return useMutation(createMultipleOrder, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    // onSettled: () => {
    //   queryClient.invalidateQueries(queryKey);
    // },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useUpdateMultipleOrderMutation() {
  const queryKey = [`${Paths.Order}/today`];
  const queryClient = useQueryClient();
  return useMutation(updateMultipleOrders, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    // onSettled: () => {
    //   queryClient.invalidateQueries(queryKey);
    // },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useGetOrders() {
  const { filterPanelFormElements } = useOrderContext();
  let url = `${baseUrl}/query?after=${filterPanelFormElements.after}`;
  if (filterPanelFormElements?.before) {
    url = url.concat(`&before=${filterPanelFormElements.before}`);
  }
  return useGetList<Order>(
    url,
    [
      `${Paths.Order}/query`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
    ],
    true
  );
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
  const { selectedDate } = useDateContext();
  return useGetList<Order>(`${baseUrl}/today?after=${selectedDate}`, [
    `${baseUrl}/today`,
    selectedDate,
  ]);
}
export function useGetGivenDateOrders() {
  const { todaysOrderDate } = useOrderContext();
  return useGetList<Order>(`${baseUrl}/today?after=${todaysOrderDate}`, [
    `${baseUrl}/today`,
    todaysOrderDate,
  ]);
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
export function useGetCategorySummary(
  category?: number,
  location?: number,
  upperCategory?: number
) {
  let url = `${Paths.Order}/category_summary?category=${category}`;
  if (location) {
    url = url.concat(`&location=${location}`);
  }
  if (upperCategory) {
    url = url.concat(`&upperCategory=${upperCategory}`);
  }
  return useGetList<{ month: string; total: number }>(
    url,
    [url, category, location, upperCategory],
    true
  );
}

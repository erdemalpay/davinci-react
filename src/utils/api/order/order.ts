import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";
import { patch, post } from "../index";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";
import { useOrderContext } from "./../../../context/Order.context";
import {
  Order,
  PersonalOrderDataType,
  PopularDiscounts,
  Table,
} from "./../../../types/index";

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
  tableId?: number;
  orders: {
    totalQuantity: number;
    selectedQuantity: number;
    orderId: number;
  }[];
}
interface CombineTablePayload {
  orders: Order[];
  oldTableId: number;
  transferredTableId: number;
}
interface DailySummary {
  topOrderCreators: Array<{
    orderCount: number;
    userId: string;
    userName: string;
  }>;
  topOrderDeliverers: Array<{
    orderCount: number;
    userId: string;
    userName: string;
  }>;
  topCollectionCreators: Array<{
    collectionCount: number;
    userId: string;
    userName: string;
  }>;
  orderPreparationStats: {
    average: {
      ms: number;
      formatted: string;
    };
    topOrders: Array<{
      order: {
        _id: number;
        item: number;
        orderTable: Table;
        deliveredAt: Date;
      };
      ms: number;
      formatted: string;
    }>;
  };
  buttonCallStats: {
    averageDuration: string;
    longestCalls: Array<{
      tableName: string;
      duration: string;
      finishHour: string;
    }>;
  };
  gameplayStats: {
    topMentors: Array<{
      gameplayCount: number;
      mentoredBy: string;
    }>;
    topComplexGames: Array<{
      mentors: string[];
      gameId: number;
      name: string;
      narrationDurationPoint: number;
    }>;
  };
}

interface TransferTablePayload {
  orders: Order[];
  oldTableId: number;
  transferredTableName: string;
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
  quantity: number;
}

const baseUrl = `${Paths.Order}`;
export function useOrderMutations() {
  const { updateItem: updateOrder, createItem: createOrder } =
    useMutationApi<Order>({
      baseQuery: baseUrl,
      additionalInvalidates: [
        [`${Paths.Order}/query`],
        [`${Paths.Order}/collection/query`],
      ],
    });

  return { updateOrder, createOrder };
}
export function useSimpleOrderMutations() {
  const { updateItem: updateSimpleOrder } = useMutationApi<Order>({
    baseQuery: `${Paths.Order}/simple`,
    additionalInvalidates: [
      [`${Paths.Order}/query`],
      [`${Paths.Order}/collection/query`],
      [`${Paths.Order}/ikas-pick-up/query`],
    ],
  });

  return { updateSimpleOrder };
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
export function combineTable(payload: CombineTablePayload) {
  return post({
    path: `/order/table_combine`,
    payload: payload,
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
export function useTransferTableMutations() {
  const queryKey = [`${Paths.Tables}`];
  const queryClient = useQueryClient();
  return useMutation(transferTable, {
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
export function useCombineTableMutation() {
  const tableBaseUrl = `${Paths.Tables}`;
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [tableBaseUrl, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();

  return useMutation(combineTable, {
    onMutate: async ({
      orders,
      oldTableId,
      transferredTableId,
    }: CombineTablePayload) => {
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
    ],
    true
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

export function useGetOrders(category?: number[]) {
  const { filterPanelFormElements } = useOrderContext();
  let url = `${baseUrl}/query?after=${filterPanelFormElements.after}`;
  const parameters = [
    "before",
    "discount",
    "createdBy",
    "preparedBy",
    "deliveredBy",
    "cancelledBy",
    "status",
    "location",
  ];
  if (category || filterPanelFormElements.category !== "") {
    url = url.concat(
      `&category=${category || filterPanelFormElements.category}`
    );
  }
  parameters.forEach((param) => {
    if (filterPanelFormElements[param]) {
      url = url.concat(
        `&${param}=${encodeURIComponent(filterPanelFormElements[param])}`
      );
    }
  });
  return useGetList<Order>(
    url,
    [
      `${Paths.Order}/query`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
      filterPanelFormElements.discount,
      filterPanelFormElements.createdBy,
      filterPanelFormElements.preparedBy,
      filterPanelFormElements.deliveredBy,
      filterPanelFormElements.cancelledBy,
      filterPanelFormElements.status,
      filterPanelFormElements.category,
      filterPanelFormElements.location,
      category,
    ],
    true
  );
}
export function useGetIkasPickUpOrders(category?: number[]) {
  const { ikasPickUpFilterPanelFormElements } = useOrderContext();
  let url = `${baseUrl}/query?after=${ikasPickUpFilterPanelFormElements.after}&isIkasPickUp=true`;
  const parameters = [
    "before",
    "discount",
    "createdBy",
    "preparedBy",
    "deliveredBy",
    "cancelledBy",
    "status",
    "location",
  ];
  if (category || ikasPickUpFilterPanelFormElements.category !== "") {
    url = url.concat(
      `&category=${category || ikasPickUpFilterPanelFormElements.category}`
    );
  }
  parameters.forEach((param) => {
    if (ikasPickUpFilterPanelFormElements[param]) {
      url = url.concat(
        `&${param}=${encodeURIComponent(
          ikasPickUpFilterPanelFormElements[param]
        )}`
      );
    }
  });
  return useGetList<Order>(
    url,
    [
      `${Paths.Order}/ikas-pick-up/query`,
      `${Paths.Order}`,

      ikasPickUpFilterPanelFormElements.after,
      ikasPickUpFilterPanelFormElements.before,
      ikasPickUpFilterPanelFormElements.discount,
      ikasPickUpFilterPanelFormElements.createdBy,
      ikasPickUpFilterPanelFormElements.preparedBy,
      ikasPickUpFilterPanelFormElements.deliveredBy,
      ikasPickUpFilterPanelFormElements.cancelledBy,
      ikasPickUpFilterPanelFormElements.status,
      ikasPickUpFilterPanelFormElements.category,
      ikasPickUpFilterPanelFormElements.location,
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

export function useGetDailySummary(date: string, location: number) {
  return useGet<DailySummary>(
    `${baseUrl}/daily-summary?date=${date}&location=${location}`,
    [`${baseUrl}/daily-summary`, date, location],
    true
  );
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
  const queryClient = useQueryClient();
  return useMutation(createOrderForDivide, {
    onMutate: async (payload) => {
      if (!payload.tableId) {
        return;
      }
      const queryKey = [`${Paths.Order}/table`, payload.tableId];
      await queryClient.cancelQueries(queryKey);
      const previousTableOrders =
        queryClient.getQueryData<Order[]>(queryKey) || [];
      const finalTableOrders: Order[] = [];

      previousTableOrders.forEach((order) => {
        const dividedOrder = payload.orders.find(
          (o) => o.orderId === order._id
        );

        if (dividedOrder) {
          const remainingQuantity =
            dividedOrder.totalQuantity - dividedOrder.selectedQuantity;

          // Seçilen kısım - id: 0
          finalTableOrders.push({
            ...order,
            _id: 0,
            quantity: dividedOrder.selectedQuantity,
            paidQuantity: 0,
          });

          // Kalan kısım - orijinal ID
          if (remainingQuantity > 0) {
            finalTableOrders.push({
              ...order,
              quantity: remainingQuantity,
            });
          }
        } else {
          finalTableOrders.push(order);
        }
      });

      queryClient.setQueryData<Order[]>(queryKey, finalTableOrders);

      return { previousTableOrders, queryKey };
    },
    onSettled: (_data, _error, _payload, context) => {
      if (context?.queryKey) {
        void queryClient.invalidateQueries(context.queryKey);
      }
    },
    onError: (_err: unknown, _payload, context) => {
      if (context?.previousTableOrders && context?.queryKey) {
        queryClient.setQueryData<Order[]>(
          context.queryKey,
          context.previousTableOrders
        );
      }

      const errorMessage =
        (_err as any)?.response?.data?.message ||
        "An unexpected error occurred";
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
export function useGetPopularDiscounts() {
  return useGetList<PopularDiscounts>(`${baseUrl}/popular-discounts`, [
    `${baseUrl}/popular-discounts`,
  ]);
}

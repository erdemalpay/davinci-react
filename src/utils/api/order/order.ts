import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "react-toastify";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";
import { patch, post } from "../index";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";
import { useOrderContext } from "./../../../context/Order.context";
import {
  CategorySummaryCompareResponse,
  DailyData,
  MonthlyData,
  Order,
  PersonalOrderDataType,
  PopularDiscounts,
  Table,
  WeeklyData,
} from "./../../../types/index";

interface CreateOrderForDiscount {
  orders: {
    totalQuantity: number;
    selectedQuantity: number;
    orderId: number;
  }[];
  discount: number;
  discountPercentage?: number;
  discountAmount?: number;
  discountNote?: string | string[];
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
  const queryClient = useQueryClient();
  const { selectedDate } = useDateContext();

  return useGetList<Order>(
    `${baseUrl}/table/${tableId}`,
    [`${Paths.Order}/table`, tableId],
    true,
    {
      onSuccess: (tableOrders) => {
        // keep todayOrders in sync with this table
        queryClient.setQueryData<Order[]>(
          [`${baseUrl}/today`, selectedDate],
          (oldTodayOrders) => {
            const current = oldTodayOrders ?? [];
            console.log(selectedDate);
            console.log((tableOrders[0]?.table as Table)?.date);
            if (selectedDate === (tableOrders[0]?.table as Table)?.date) {
              // 1. remove existing orders for this table
              const withoutThisTable = current.filter(
                (order) => (order.table as Table)?._id !== tableId
              );

              // 2. add fresh table orders
              return [...withoutThisTable, ...tableOrders];
            }
            return current;
          }
        );
      },
    }
  );
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
    "item",
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
      filterPanelFormElements.item,
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
  return useGetList<Order>(
    `${baseUrl}/today?after=${selectedDate}`,
    [`${baseUrl}/today`, selectedDate],
    false, // isStaleTimeZero - keep staleTime as Infinity
    {
      refetchOnWindowFocus: true,
    }
  );
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

// Deterministik random generator (seed-based)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Mock data generator
function generateMockCompareData(
  granularity: "daily" | "weekly" | "monthly",
  primaryAfter: string,
  primaryBefore: string,
  secondaryAfter: string,
  secondaryBefore: string
): CategorySummaryCompareResponse {
  // Seed olarak tarih string'ini kullan (deterministik)
  const seed =
    primaryAfter.split("-").join("") + primaryBefore.split("-").join("");
  let seedCounter = 0;

  if (granularity === "daily") {
    // Son 7 gün için mock data
    const primaryData: DailyData[] = [];
    const secondaryData: DailyData[] = [];
    const primaryDate = new Date(primaryAfter);
    const secondaryDate = new Date(secondaryAfter);
    const days = Math.ceil(
      (new Date(primaryBefore).getTime() - primaryDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    for (let i = 0; i <= days; i++) {
      const currentPrimaryDate = new Date(primaryDate);
      currentPrimaryDate.setDate(primaryDate.getDate() + i);
      const currentSecondaryDate = new Date(secondaryDate);
      currentSecondaryDate.setDate(secondaryDate.getDate() + i);

      const dayLabels = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
      const dayLabel =
        dayLabels[currentPrimaryDate.getDay()] ||
        dayLabels[currentPrimaryDate.getDay()];

      // Deterministik random değerler
      const primarySeed = parseInt(seed) + i;
      const secondarySeed = parseInt(seed) + i + 1000;

      primaryData.push({
        date: currentPrimaryDate.toISOString().split("T")[0],
        label: dayLabel,
        total: 35000 + seededRandom(primarySeed) * 20000,
      });

      secondaryData.push({
        date: currentSecondaryDate.toISOString().split("T")[0],
        label: dayLabel,
        total: 30000 + seededRandom(secondarySeed) * 15000,
      });
    }

    const primaryTotal = primaryData.reduce((sum, d) => sum + d.total, 0);
    const secondaryTotal = secondaryData.reduce((sum, d) => sum + d.total, 0);

    // Label formatını düzelt (backend requirements'a göre)
    const formatPeriodLabel = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startFormatted = format(startDate, "dd MMM", { locale: tr });
      const endFormatted = format(endDate, "dd MMM", { locale: tr });
      return `${startFormatted} - ${endFormatted}`;
    };

    return {
      primaryPeriod: {
        granularity: "daily",
        label: formatPeriodLabel(primaryAfter, primaryBefore),
        startDate: primaryAfter,
        endDate: primaryBefore,
        data: primaryData,
        totalRevenue: primaryTotal,
      },
      secondaryPeriod: {
        granularity: "daily",
        label: formatPeriodLabel(secondaryAfter, secondaryBefore),
        startDate: secondaryAfter,
        endDate: secondaryBefore,
        data: secondaryData,
        totalRevenue: secondaryTotal,
      },
      comparisonMetrics: {
        percentageChange:
          ((primaryTotal - secondaryTotal) / secondaryTotal) * 100,
        absoluteChange: primaryTotal - secondaryTotal,
      },
    };
  } else if (granularity === "weekly") {
    // Haftalık mock data
    const primaryData: WeeklyData[] = [];
    const secondaryData: WeeklyData[] = [];

    // Primary period için haftaları hesapla
    const primaryStart = new Date(primaryAfter);
    const primaryEnd = new Date(primaryBefore);
    const secondaryStart = new Date(secondaryAfter);
    const secondaryEnd = new Date(secondaryBefore);

    // Hafta sayısını hesapla
    const weeks =
      Math.ceil(
        (primaryEnd.getTime() - primaryStart.getTime()) /
          (1000 * 60 * 60 * 24 * 7)
      ) || 4;

    for (let i = 0; i < weeks; i++) {
      const weekStartPrimary = new Date(primaryStart);
      weekStartPrimary.setDate(primaryStart.getDate() + i * 7);
      const weekEndPrimary = new Date(weekStartPrimary);
      weekEndPrimary.setDate(weekStartPrimary.getDate() + 6);

      // Eğer weekEndPrimary primaryEnd'den büyükse, primaryEnd'i kullan
      if (weekEndPrimary > primaryEnd) {
        weekEndPrimary.setTime(primaryEnd.getTime());
      }

      const weekStartSecondary = new Date(secondaryStart);
      weekStartSecondary.setDate(secondaryStart.getDate() + i * 7);
      const weekEndSecondary = new Date(weekStartSecondary);
      weekEndSecondary.setDate(weekStartSecondary.getDate() + 6);

      // Eğer weekEndSecondary secondaryEnd'den büyükse, secondaryEnd'i kullan
      if (weekEndSecondary > secondaryEnd) {
        weekEndSecondary.setTime(secondaryEnd.getTime());
      }

      // Deterministik random değerler
      const primarySeed = parseInt(seed) + i;
      const secondarySeed = parseInt(seed) + i + 1000;

      primaryData.push({
        weekStart: weekStartPrimary.toISOString().split("T")[0],
        weekEnd: weekEndPrimary.toISOString().split("T")[0],
        label: `Hafta ${i + 1}`,
        total: 250000 + seededRandom(primarySeed) * 100000,
      });

      secondaryData.push({
        weekStart: weekStartSecondary.toISOString().split("T")[0],
        weekEnd: weekEndSecondary.toISOString().split("T")[0],
        label: `Hafta ${i + 1}`,
        total: 200000 + seededRandom(secondarySeed) * 80000,
      });
    }

    const primaryTotal = primaryData.reduce((sum, d) => sum + d.total, 0);
    const secondaryTotal = secondaryData.reduce((sum, d) => sum + d.total, 0);

    // Label formatını düzelt
    const formatPeriodLabel = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startFormatted = format(startDate, "dd MMM", { locale: tr });
      const endFormatted = format(endDate, "dd MMM", { locale: tr });
      return `${startFormatted} - ${endFormatted}`;
    };

    return {
      primaryPeriod: {
        granularity: "weekly",
        label: formatPeriodLabel(primaryAfter, primaryBefore),
        startDate: primaryAfter,
        endDate: primaryBefore,
        data: primaryData,
        totalRevenue: primaryTotal,
      },
      secondaryPeriod: {
        granularity: "weekly",
        label: formatPeriodLabel(secondaryAfter, secondaryBefore),
        startDate: secondaryAfter,
        endDate: secondaryBefore,
        data: secondaryData,
        totalRevenue: secondaryTotal,
      },
      comparisonMetrics: {
        percentageChange:
          ((primaryTotal - secondaryTotal) / secondaryTotal) * 100,
        absoluteChange: primaryTotal - secondaryTotal,
      },
    };
  } else {
    // Aylık mock data
    const months = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];
    const primaryData: MonthlyData[] = [];
    const secondaryData: MonthlyData[] = [];

    for (let i = 0; i < 12; i++) {
      const monthNum = String(i + 1).padStart(2, "0");
      // Deterministik random değerler
      const primarySeed = parseInt(seed) + i;
      const secondarySeed = parseInt(seed) + i + 1000;

      primaryData.push({
        month: `2024-${monthNum}`,
        label: months[i],
        total: 1200000 + seededRandom(primarySeed) * 300000,
      });

      secondaryData.push({
        month: `2023-${monthNum}`,
        label: months[i],
        total: 1000000 + seededRandom(secondarySeed) * 250000,
      });
    }

    const primaryTotal = primaryData.reduce((sum, d) => sum + d.total, 0);
    const secondaryTotal = secondaryData.reduce((sum, d) => sum + d.total, 0);

    // Label formatını düzelt (aylık için farklı format)
    const formatPeriodLabel = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startFormatted = format(startDate, "dd MMM", { locale: tr });
      const endFormatted = format(endDate, "dd MMM yyyy", { locale: tr });
      return `${startFormatted} - ${endFormatted}`;
    };

    return {
      primaryPeriod: {
        granularity: "monthly",
        label: formatPeriodLabel(primaryAfter, primaryBefore),
        startDate: primaryAfter,
        endDate: primaryBefore,
        data: primaryData,
        totalRevenue: primaryTotal,
      },
      secondaryPeriod: {
        granularity: "monthly",
        label: formatPeriodLabel(secondaryAfter, secondaryBefore),
        startDate: secondaryAfter,
        endDate: secondaryBefore,
        data: secondaryData,
        totalRevenue: secondaryTotal,
      },
      comparisonMetrics: {
        percentageChange:
          ((primaryTotal - secondaryTotal) / secondaryTotal) * 100,
        absoluteChange: primaryTotal - secondaryTotal,
      },
    };
  }
}

export function useGetCategorySummaryCompare(
  primaryAfter: string,
  primaryBefore: string,
  secondaryAfter: string,
  secondaryBefore: string,
  granularity: "daily" | "weekly" | "monthly",
  location?: number,
  upperCategory?: number,
  category?: number
) {
  let url = `${Paths.Order}/category_summary/compare?primaryAfter=${primaryAfter}&primaryBefore=${primaryBefore}&secondaryAfter=${secondaryAfter}&secondaryBefore=${secondaryBefore}&granularity=${granularity}`;

  if (location !== undefined && location !== null) {
    url = url.concat(`&location=${location}`);
  }
  if (upperCategory !== undefined && upperCategory !== null) {
    url = url.concat(`&upperCategory=${upperCategory}`);
  }
  if (category !== undefined && category !== null) {
    url = url.concat(`&category=${category}`);
  }

  const realData = useGet<CategorySummaryCompareResponse>(
    url,
    [
      `${Paths.Order}/category_summary/compare`,
      primaryAfter,
      primaryBefore,
      secondaryAfter,
      secondaryBefore,
      granularity,
      location,
      upperCategory,
      category,
    ],
    true
  );

  // Mock data kullan (backend hazır olana kadar)
  // TODO: Backend hazır olduğunda bu satırı kaldır ve sadece realData döndür
  // Seed-based deterministik random kullanıldığı için aynı parametreler için aynı data üretilir
  // Bu sayede sürekli render sorunu çözülür
  const mockData = generateMockCompareData(
    granularity,
    primaryAfter,
    primaryBefore,
    secondaryAfter,
    secondaryBefore
  );

  // Backend'den veri gelirse onu kullan, yoksa mock data kullan
  return realData || (mockData as any);
}
export function useGetPopularDiscounts() {
  return useGetList<PopularDiscounts>(`${baseUrl}/popular-discounts`, [
    `${baseUrl}/popular-discounts`,
  ]);
}

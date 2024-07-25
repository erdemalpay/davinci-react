import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Paths, useGetList, useMutationApi } from "../factory";
import { patch, post } from "../index";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";
import { Order, OrderPaymentItem } from "./../../../types/index";

interface CreateOrderForDiscount {
  createOrderDto: Order;
  orderPaymentId: number;
  newOrderPaymentItems: OrderPaymentItem[];
  discount: number;
  discountPercentage: number;
}

const baseUrl = `${Paths.Order}`;
export function useOrderMutations() {
  const {
    deleteItem: deleteOrder,
    updateItem: updateOrder,
    createItem: createOrder,
  } = useMutationApi<Order>({
    baseQuery: baseUrl,
    additionalInvalidates: [[`${Paths.Tables}`], [`${Paths.Order}/today`]],
  });

  return { deleteOrder, updateOrder, createOrder };
}

export function deleteTableOrders({ ids }: { ids: number[] }) {
  return patch({
    path: `/order/delete_multiple`,
    payload: { ids },
  });
}
export function updateMultipleOrdersStatus({
  ids,
  status,
}: {
  ids: number[];
  status: string;
}) {
  return patch({
    path: `/order/update_multiple`,
    payload: { ids: ids, status: status },
  });
}
export function useUpdateMultipleOrderMutation() {
  const queryKey = [`${Paths.Order}/today`];
  const queryClient = useQueryClient();
  return useMutation(updateMultipleOrdersStatus, {
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

export function useGetOrders() {
  return useGetList<Order>(baseUrl);
}

export function useGetGivenDateOrders() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  return useGetList<Order>(
    `${baseUrl}/date/?location=${selectedLocationId}&date=${selectedDate}`,
    [Paths.Order, selectedLocationId, selectedDate]
  );
}
export function createOrderForDiscount(payload: CreateOrderForDiscount) {
  return post<CreateOrderForDiscount, Order>({
    path: `${Paths.Order}/discount`,
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
      queryClient.invalidateQueries([`${Paths.Order}/payment`]);
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

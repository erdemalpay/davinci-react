import { OrderPayment } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Order}/payment`;
export function useOrderPaymentMutations() {
  const {
    deleteItem: deleteOrderPayment,
    updateItem: updateOrderPayment,
    createItem: createOrderPayment,
  } = useMutationApi<OrderPayment>({
    baseQuery: baseUrl,
  });
  return {
    deleteOrderPayment,
    updateOrderPayment,
    createOrderPayment,
  };
}

export function useGetOrderPayments() {
  return useGetList<OrderPayment>(baseUrl);
}
